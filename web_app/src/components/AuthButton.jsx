import { useEffect } from 'react';
import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useToast,
} from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '@/store/auth';

const AuthButton = () => {
  const { user, status, error, clearError, signIn, signOut, enabled } =
    useAuth();
  const toast = useToast();

  useEffect(() => {
    if (!error) return;
    toast({ status: 'error', title: error, isClosable: true, duration: 8000 });
    clearError();
  }, [error, clearError, toast]);

  if (!enabled || status === 'loading') return null;

  if (status === 'signedIn') {
    return (
      <Menu placement='bottom-end'>
        <MenuButton
          as={Button}
          size='sm'
          variant='ghost'
          color='blue.800'
          fontSize='xs'
          fontWeight={700}
          textTransform='uppercase'
        >
          {user.email}
        </MenuButton>
        <MenuList fontSize='sm'>
          <MenuItem onClick={signOut}>Sign out</MenuItem>
        </MenuList>
      </Menu>
    );
  }

  return (
    <Button
      size='sm'
      variant='outline'
      color='blue.800'
      bg='white'
      leftIcon={<FcGoogle />}
      fontSize='xs'
      fontWeight={700}
      textTransform='uppercase'
      onClick={signIn}
    >
      Sign in with Google
    </Button>
  );
};

export default AuthButton;
