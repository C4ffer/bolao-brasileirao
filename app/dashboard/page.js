import { redirect } from 'next/navigation';
import { getSession } from '../lib/auth';
import { prisma } from '../lib/prisma';
import Navbar from '../components/Navbar';
import { getCartolaMatches } from '../lib/cartolaApi';
import PredictionCard from './PredictionCard';

export default async function Dashboard() {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  // Obter jogos do Cartola API
  const cartolaData = await getCartolaMatches();
  
  if (!cartolaData || !cartolaData.partidas) {
    return (
      <div className="container">
        <Navbar username={session.username} />
        <div style={{ textAlign: 'center', marginTop: '64px' }}>
          <h2 className="title-gradient">Erro ao carregar jogos</h2>
          <p>Tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }

  const { partidas, clubes, rodada } = cartolaData;

  // Obter os palpites deste usuário
  const userPredictions = await prisma.prediction.findMany({
    where: { userId: session.id }
  });

  const predictionsMap = {};
  userPredictions.forEach(p => {
    predictionsMap[p.matchId] = p;
  });

  // Mapear partidas com os clubes e os palpites
  const enrichedMatches = partidas.map(match => ({
    ...match,
    clube_casa: clubes[match.clube_casa_id],
    clube_visitante: clubes[match.clube_visitante_id]
  })).sort((a, b) => new Date(a.partida_data) - new Date(b.partida_data));

  return (
    <div className="container">
      <Navbar username={session.username} />
      
      <main className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2>Rodada Atual <span className="title-gradient">{rodada}</span></h2>
          <p style={{ color: 'var(--text-muted)' }}>Faça seus palpites antes dos jogos começarem!</p>
        </div>

        <div>
          {enrichedMatches.map(match => (
            <PredictionCard 
              key={match.partida_id} 
              match={match} 
              userPrediction={predictionsMap[match.partida_id]} 
            />
          ))}
        </div>
      </main>
    </div>
  );
}
