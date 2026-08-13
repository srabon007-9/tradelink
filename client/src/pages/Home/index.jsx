/**
 * pages/Home/index.jsx — Home Page
 *
 * Assembles all landing page sections in order.
 */

import HeroSection      from './HeroSection';
import HowItWorks       from './HowItWorks';
import PlatformFeatures from './PlatformFeatures';
import Testimonials     from './Testimonials';

const Home = () => (
  <>
    <HeroSection />
    <HowItWorks />
    <PlatformFeatures />
    <Testimonials />
  </>
);

export default Home;
