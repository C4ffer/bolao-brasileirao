export async function getCartolaMatches() {
  try {
    const res = await fetch('https://api.cartola.globo.com/partidas', {
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
