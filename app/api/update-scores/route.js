import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import { getCartolaMatches } from '../../lib/cartolaApi';

export async function GET() {
  try {
    const data = await getCartolaMatches();
    if (!data || !data.partidas) {
      return NextResponse.json({ error: 'Erro ao conectar à API do Cartola' }, { status: 500 });
    }

    const { partidas } = data;
    let updatedCount = 0;

    for (const match of partidas) {
      // Pular se os placares oficiais ainda não existem (jogo não finalizado ou não iniciado)
      if (match.placar_oficial_mandante === null || match.placar_oficial_visitante === null) {
        continue;
      }

      const realHome = match.placar_oficial_mandante;
      const realAway = match.placar_oficial_visitante;

      const realResult = realHome > realAway ? 'HOME' : realHome < realAway ? 'AWAY' : 'TIE';

      // Pegar todos os palpites para esta partida que ainda não foram computados
      const predictions = await prisma.prediction.findMany({
        where: { matchId: match.partida_id, pointsEarned: null }
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

        // Atualizar palpite e os pontos do usuário em uma transaction
        await prisma.$transaction([
          prisma.prediction.update({
            where: { id: p.id },
            data: { pointsEarned: points }
          }),
          prisma.user.update({
            where: { id: p.userId },
            data: { points: { increment: points } }
          })
        ]);

        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, updatedPredictions: updatedCount });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Falha interna do servidor' }, { status: 500 });
  }
}
