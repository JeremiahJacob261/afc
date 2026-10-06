import Home from '@/components/ucl/LandingPage';
import { getI18nServerSideProps } from '@/lib/i18nServerSideProps';

export default Home;

export async function getStaticProps({ locale }) {
  return { props: { ...(await getI18nServerSideProps(locale)) } };
}
