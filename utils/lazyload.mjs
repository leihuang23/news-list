export default function lazyLoad() {
  const lazyImgs = document.querySelectorAll('.lazy');
  const imageObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const image = entry.target;
        image.src = image.dataset.src;
        image.classList.remove('lazy');
        imageObserver.unobserve(image);
      }
    });
  });

  lazyImgs.forEach(function(image) {
    imageObserver.observe(image);
  });
}
