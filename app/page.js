import ProductExperience from '../components/ProductExperience';
import { products } from '../data/products';

export default function Home() {
  return <ProductExperience products={products} />;
}
