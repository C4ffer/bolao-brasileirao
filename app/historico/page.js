import { redirect } from 'next/navigation';
import { getSession } from '../lib/auth';
import { prisma } from '../lib/prisma';
import Navbar from '../components/Navbar';
import { getCartolaMatches } from '../lib/cartolaApi';
import Link from 'next/link';

export default async function Historico({ searchParams }) {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const params = await searchParams;
  const rodadaParam = params?.rodada || null;
  const targetUserId = params?.userId || null;

  // Busca dados daquela rodada
  const cartolaData = await getCartolaMatches(rodadaParam);
  if (!cartolaData || !cartolaData.partidas) {
    return (
      <div className="container">
        <Navbar username={session.username} />
        <h2 style={{ textAlign: 'center', marginTop: '64px' }} className="title-gradient">Erro ao carregar dados.</h2>
      </div>
    );
  }

  const { partidas, clubes, rodada } = cartolaData;

  // Busca todos os usuários do bolão
  const allUsers = await prisma.user.findMany({ select: { id: true, username: true }, orderBy: { points: 'desc' } });

  // Pega os match IDs dessa rodada
  const matchIds = partidas.map(p => p.partida_id);

  // Pega palpites
  const predictions = await prisma.prediction.findMany({
    where: { 
      matchId: { in: matchIds },
      ...(targetUserId ? { userId: targetUserId } : {})
    },
    include: { user: { select: { username: true } } }
  });

  return (
    <div className="container">
      <Navbar username={session.username} />
      
      <main className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          <h2>Histórico e <span className="title-gradient">Palpites da Galera</span></h2>
          
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>Rodada:</span>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px' }}>
                {[...Array(rodada + 1)].map((_, i) => {
                  const r = i + 1;
                  // Não deixar criar botão se for pro futuro (Cartola só dá a rodada atual ou passadas pra gente prever fácil)
                  // Mas o cartola.rodada é a atual. Vamos listar da 1 até a (rodada atual)
                  if (r > cartolaData.rodada && !rodadaParam) return null; 
                  return (
                    <Link 
                      key={r} 
                      href={`/historico?rodada=${r}${targetUserId ? `&userId=${targetUserId}` : ''}`}
                      className={r === rodada ? "btn-primary" : ""}
                      style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--surface-border)', color: r === rodada ? '#fff' : 'var(--text-main)', background: r === rodada ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }}
                    >
                      {r}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <span style={{ fontWeight: 'bold' }}>Jogador:</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link 
                  href={`/historico?rodada=${rodada}`}
                  style={{ padding: '6px 12px', borderRadius: '4px', border: targetUserId === null ? '1px solid var(--secondary)' : '1px solid var(--surface-border)', color: targetUserId === null ? 'var(--secondary)' : 'var(--text-muted)' }}
                >
                  Visão Geral
                </Link>
                {allUsers.map(u => (
                  <Link 
                    key={u.id}
                    href={`/historico?rodada=${rodada}&userId=${u.id}`}
                    style={{ padding: '6px 12px', borderRadius: '4px', border: targetUserId === u.id ? '1px solid var(--primary)' : '1px solid var(--surface-border)', color: targetUserId === u.id ? 'var(--primary)' : 'var(--text-main)' }}
                  >
                    {u.id === session.id ? 'Você' : u.username}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {targetUserId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {partidas.map(match => {
              const pData = new Date(match.partida_data);
              const isLocked = Date.now() >= pData.getTime();
              const pred = predictions.find(p => p.matchId === match.partida_id);
              const userSeesOwn = targetUserId === session.id;

              return (
                <div key={match.partida_id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{match.local}</span>
                    <span>{pData.toLocaleString('pt-BR')}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
                      <span style={{ fontWeight: '600' }}>{clubes[match.clube_casa_id].nome}</span>
                      <img src={clubes[match.clube_casa_id].escudos['45x45']} width={30} />
                    </div>

                    <div style={{ padding: '0 24px', textAlign: 'center' }}>
                      {pred ? (
                        (isLocked || userSeesOwn) ? (
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px' }}>
                              {pred.homeScore} x {pred.awayScore}
                            </div>
                        ) : (
                          <div style={{ fontSize: '0.9rem', color: 'var(--secondary)', border: '1px dashed var(--secondary)', padding: '8px 16px', borderRadius: '8px' }}>
                            Palpite Escondido 🔒
                          </div>
                        )
                      ) : (
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sem palpite</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <img src={clubes[match.clube_visitante_id].escudos['45x45']} width={30} />
                      <span style={{ fontWeight: '600' }}>{clubes[match.clube_visitante_id].nome}</span>
                    </div>
                  </div>

                  {(match.placar_oficial_mandante !== null) && (
                    <div style={{ textAlign: 'center', color: 'var(--secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
                      Placar Oficial: {match.placar_oficial_mandante} x {match.placar_oficial_visitante}
                      {pred && isLocked && (
                         <span style={{ marginLeft: '12px', color: pred.pointsEarned === 3 ? '#eab308' : pred.pointsEarned === 1 ? '#60a5fa' : 'var(--danger)' }}>
                           ({pred.pointsEarned !== null ? `Ganhou ${pred.pointsEarned} pts` : 'Pontos a calcular'})
                         </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '24px', textAlign: 'center' }}>Resumo da Rodada {rodada}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Jogador</th>
                  <th style={{ padding: '12px' }}>Status de Palpites (Visão Geral)</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user, index) => {
                  const userPreds = predictions.filter(p => p.userId === user.id);
                  const totalPartidas = partidas.length;
                  const palpitados = userPreds.length;
                  const faltam = totalPartidas - palpitados;

                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 12px', fontWeight: 'bold' }}>
                        {user.username} {user.id === session.id && <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px' }}>Você</span>}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        {palpitados > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${(palpitados / totalPartidas) * 100}%`, background: palpitados === totalPartidas ? 'var(--secondary)' : 'var(--primary)', height: '100%' }}></div>
                            </div>
                            <span style={{ fontSize: '0.9rem', color: palpitados === totalPartidas ? 'var(--secondary)' : 'var(--text-muted)' }}>
                              {palpitados} de {totalPartidas} jogos
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Nenhum palpite ainda ({faltam} restantes)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
