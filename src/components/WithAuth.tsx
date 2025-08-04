'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Flex, Spinner } from '@chakra-ui/react';

const WithAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const AuthComponent = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/');
      }
    }, [user, loading, router]);

    if (loading || !user) {
      return (
        <Flex
          justify="center"
          align="center"
          minH="100vh"
        >
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
          />
        </Flex>
      );
    }

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default WithAuth;