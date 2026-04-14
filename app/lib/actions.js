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

