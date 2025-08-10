'use client';

import React from 'react';
import { Box, VStack, Text, Link as ChakraLink, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconType } from 'react-icons';

export interface NavItem {
  href: string;
  label: string;
  icon?: IconType;
}

export interface NavGroup {
  label: string;
  icon?: IconType;
  children: NavItem[];
}

export type NavigationLink = NavItem | NavGroup;

interface SidebarProps {
  navLinks: NavigationLink[];
}

const Sidebar = ({ navLinks }: SidebarProps) => {
  const pathname = usePathname();

  const renderLink = (item: NavItem) => {
    const isActive = pathname === item.href;

    return (
      <ChakraLink
        as={Link}
        href={item.href}
        key={item.label}
        display="flex"
        alignItems="center"
        py={2}
        px={2}
        borderRadius="md"
        color={isActive ? 'blue.500' : 'gray.600'}
        bg={isActive ? 'blue.50' : 'transparent'}
        _hover={{
          bg: 'gray.100',
          textDecoration: 'none',
        }}
        fontWeight={isActive ? 'semibold' : 'regular'}
        transition="background 0.2s, color 0.2s"
        borderLeft="4px"
        borderColor={isActive ? 'blue.500' : 'transparent'}
      >
        {item.icon && <Box as={item.icon} mr={2} />}
        {item.label}
      </ChakraLink>
    );
  };

  const activeGroupIndex = navLinks.findIndex(link =>
    'children' in link && link.children.some(child => pathname.startsWith(child.href))
  );

  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      zIndex="sticky"
      h="full"
      w="64"
      bg="brand.surface"
      borderRightWidth="1px"
      borderColor="brand.lightBorder"
      overflowY="auto"
    >
      <VStack p={5} align="stretch" spacing={4}>
        <Text fontSize="2xl" fontWeight="bold" mb={5} textAlign="center">FlowDash</Text>
        <VStack align="stretch" spacing={1}>
          {navLinks.map((link) => {
            if ('children' in link) {
              // It's a group
              return (
                <Accordion allowToggle defaultIndex={activeGroupIndex !== -1 ? [activeGroupIndex] : undefined} key={link.label}>
                  <AccordionItem border="none">
                    <h2>
                      <AccordionButton p={3} borderRadius="md" _hover={{ bg: 'gray.100' }}>
                        <Box
                          flex="1"
                          textAlign="left"
                          fontWeight="regular"
                          color="gray.700"
                          fontSize="md"
                          display="flex"
                          alignItems="center"
                        >
                          {link.icon && <Box as={link.icon} mr={3} />}
                          {link.label}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={2} pt={1}>
                      <VStack align="stretch" spacing={1}>
                        {link.children.map(renderLink)}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              );
            }
            // It's a single link
            return renderLink(link);
          })}
        </VStack>
      </VStack>
    </Box>
  );
};

export default Sidebar;