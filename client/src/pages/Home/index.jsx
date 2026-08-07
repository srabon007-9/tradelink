/**
 * pages/Home/index.jsx — Home Page
 *
 * Assembles all landing page sections in order.
 */

import HeroSection      from './HeroSection';
import HowItWorks       from './HowItWorks';
import FeaturedSkills   from './FeaturedSkills';
import PlatformFeatures from './PlatformFeatures';
import Testimonials     from './Testimonials';
import CallToAction     from './CallToAction';

const Home = () => (
  <>
    <HeroSection />
    <HowItWorks />
    <FeaturedSkills />
    <PlatformFeatures />
    <Testimonials />
    <CallToAction />
  </>
);

export default Home;
