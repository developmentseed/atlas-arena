import NextLink from 'next/link';
import { Link } from '@chakra-ui/react';

const CustomLink = ({ href, text }) => {
  return (
    <Link color='blue.500' asChild>
      <NextLink href={href}>{text}</NextLink>
    </Link>
  );
};

export default CustomLink;
