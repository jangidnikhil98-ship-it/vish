export function StarRow({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <>
      {[...Array(full)].map((_, i) => (
        <i key={`f-${i}`} className="fa-solid fa-star" />
      ))}
      {half === 1 && <i className="fa-solid fa-star-half-stroke" />}
      {[...Array(empty)].map((_, i) => (
        <i key={`e-${i}`} className="fa-regular fa-star" />
      ))}
    </>
  );
}
