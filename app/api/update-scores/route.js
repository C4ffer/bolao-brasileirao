import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { getCartolaMatches } from '../../lib/cartolaApi';

export async function GET() {
  try {
    const initialData = await getCartolaMatches();
    if (!initialData || !initialData.rodada) {
      return NextResponse.json({ error: 'Erro ao conectar à API do Cartola' }, { status: 500 });
    }

    const currentRound = initialData.rodada;
    let updatedCount = 0;
    
    // Check all rounds up to the current one to ensure past matches are synced
    for (let r = 1; r <= currentRound; r++) {
      const data = await getCartolaMatches(r);
      if (!data || !data.partidas) continue;

      const { partidas } = data;

    for (const match of partidas) {
      // Pular se os placares oficiais ainda não existem (jogo não finalizado ou não iniciado)
      if (match.placar_oficial_mandante === null || match.placar_oficial_visitante === null) {
        continue;
      }

      const realHome = match.placar_oficial_mandante;
      const realAway = match.placar_oficial_visitante;

      const realResult = realHome > realAway ? 'HOME' : realHome < realAway ? 'AWAY' : 'TIE';

      // Pegar todos os palpites para esta partida
      const predictions = await prisma.prediction.findMany({
        where: { matchId: match.partida_id }
      });

      for (const p of predictions) {
        const predHome = p.homeScore;
        const predAway = p.awayScore;
        const predResult = predHome > predAway ? 'HOME' : predHome < predAway ? 'AWAY' : 'TIE';

        let points = 0;

        if (predHome === realHome && predAway === realAway) {
          points = 3; // Placard exato
        } else if (predResult === realResult) {
          points = 1; // Acertou vencedor ou empate
        } else {
          points = 0; // Errou tudo
        }

        // Se a pontuação mudou (ou se é a primeira vez)
        if (p.pointsEarned !== points) {
          const delta = points - (p.pointsEarned || 0);

          // Atualizar palpite e os pontos do usuário em uma transaction
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

          updatedCount++;
        }
      }
    }
    }

    return NextResponse.json({ success: true, updatedPredictions: updatedCount });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Falha interna do servidor' }, { status: 500 });
  }
}
