export async function getCartolaMatches(rodadaId = null) {
  try {
    const url = rodadaId 
      ? `https://api.cartola.globo.com/partidas/${rodadaId}`
      : 'https://api.cartola.globo.com/partidas';
      
    const res = await fetch(url, {
      next: { revalidate: 60 } // revalidate every 1 minute
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch from cartola api');
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Cartola API Error:", error);
    return null;
  }
}
