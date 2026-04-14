'use server'

import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { login, logout, getSession } from './auth';
import { redirect } from 'next/navigation';

export async function authAction(prevState, formData) {
  const isRegister = formData.get('isRegister') === 'true';
  const username = formData.get('username')?.trim();
  const password = formData.get('password');

  if (!username || !password) {
    return { error: 'Preencha todos os campos!' };
  }

  try {
    if (isRegister) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) return { error: 'Usuário já existe' };
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
        }
      });
      await login(user);
    } else {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) return { error: 'Usuário não encontrado' };
      
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return { error: 'Senha incorreta' };
      
      await login(user);
    }
  } catch (error) {
    return { error: 'Ocorreu um erro. Tente novamente.' };
  }
  
  redirect('/dashboard');
}

export async function logoutAction() {
  await logout();
  redirect('/');
}

export async function savePredictionAction(matchId, homeScore, awayScore) {
  const session = await getSession();
  if (!session) return { error: 'Não autorizado' };

  try {
    await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId: session.id,
          matchId: parseInt(matchId)
        }
      },
      update: {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore)
      },
      create: {
        userId: session.id,
        matchId: parseInt(matchId),
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore)
      }
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Erro ao salvar palpite' };
  }
}

import { getCartolaMatches } from './cartolaApi';
import { revalidatePath } from 'next/cache';

export async function updateScoresAction() {
  const session = await getSession();
  if (!session) return;
  
  try {
    const currentData = await getCartolaMatches();
    if (!currentData) return;
    const currentRodada = currentData.rodada || 1;

    // Sincroniza retroativamente: verifica todas as rodadas até a atual!
    // Usamos um loop para garantir que tudo do passado vire ponto.
    for (let r = 1; r <= currentRodada; r++) {
      const data = await getCartolaMatches(r);
      if (!data || !data.partidas) continue;

      for (const match of data.partidas) {
        if (match.placar_oficial_mandante === null || match.placar_oficial_visitante === null) continue;

        const realHome = match.placar_oficial_mandante;
        const realAway = match.placar_oficial_visitante;
        const realResult = realHome > realAway ? 'HOME' : realHome < realAway ? 'AWAY' : 'TIE';

        const predictions = await prisma.prediction.findMany({
          where: { matchId: match.partida_id }
        });

        for (const p of predictions) {
          const predHome = p.homeScore;
          const predAway = p.awayScore;
          const predResult = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'TIE';

          let points = 0;
          if (predHome === realHome && predAway === realAway) {
            points = 3;
          } else if (predResult === realResult) {
            points = 1;
          }

          if (p.pointsEarned !== points) {
            const delta = points - (p.pointsEarned || 0);

            await prisma.$transaction([
              prisma.prediction.update({
                where: { id: p.id },
                data: { pointsEarned: points }
              }),
              prisma.user.update({
                where: { id: p.userId },
                data: { points: { increment: delta } }
              })
            ]);
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  
  revalidatePath('/ranking');
  revalidatePath('/historico');
}

