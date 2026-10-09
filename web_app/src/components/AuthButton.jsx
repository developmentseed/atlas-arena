import { useEffect } from 'react';
import { Button, Menu, Portal } from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/store/auth';
import { toaster } from '@/components/ui/toaster';

const AuthButton = () => {
  const { user, status, error, clearError, signIn, signOut, enabled } =
    useAuth();

  useEffect(() => {
    if (!error) return;
    toaster.create({
      type: 'error',
      title: error,
      closable: true,
      duration: 8000,
    });
    clearError();
  }, [error, clearError]);

  if (!enabled || status === 'loading') return null;

  if (status === 'signedIn') {
    return (
      <Menu.Root positioning={{ placement: 'bottom-end' }}>
        <Menu.Trigger asChild>
          <Button
            size='sm'
            variant='ghost'
            color='blue.800'
            fontSize='xs'
            fontWeight={700}
            textTransform='uppercase'
          >
            {user.email}
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value='sign-out' onSelect={signOut}>
                Sign out
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    );
  }

  return (
    <Button
      size='sm'
      variant='outline'
      color='blue.800'
      bg='white'
      fontSize='xs'
      fontWeight={700}
      textTransform='uppercase'
      onClick={signIn}
    >
      <FcGoogle />
      Sign in with Google
    </Button>
  );
};

export default AuthButton;
