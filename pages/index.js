import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to test-dna-report page
    router.replace('/test-dna-report');
  }, [router]);

  return null;
}
