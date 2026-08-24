import { getFaqs, getTestimonials } from '@/lib/data-access';
import { LandingPage } from '@/components/landing/LandingPage';

export default async function Page() {
  // Fetched here rather than inside the sections so those components stay pure.
  const [faqs, testimonials] = await Promise.all([getFaqs(), getTestimonials()]);

  return <LandingPage faqs={faqs} testimonials={testimonials} />;
}
