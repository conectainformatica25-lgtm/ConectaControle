import {
  Box,
  Heading,
  Input,
  InputField,
  Text,
  VStack,
} from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Linking } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import * as authService from '@/services/authService';
import { isMockMode } from '@/services/mock/env';
import { API_BASE_URL } from '@/services/api/config';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setErr(null);
    setLoading(true);
    try {
      await authService.signIn(email.trim(), password);
      router.replace('/(app)/(tabs)');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  }

  function openAdminPanel() {
    const base = API_BASE_URL.replace(/\/api\/?$/, '');
    Linking.openURL(`${base}/admin`);
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <VStack space="xl" py="$8">
          {/* Botão discreto do painel admin */}
          <Box position="absolute" right={0} top={0} zIndex={10}>
            <Pressable onPress={openAdminPanel} hitSlop={12}>
              <Text size="xs" color="$textLight400" style={{ opacity: 0.5 }}>
                ⚙ Admin
              </Text>
            </Pressable>
          </Box>

          <Box>
            <Heading size="xl" color="$primary500">
              ConectaControle
            </Heading>
            <Text color="$textLight500" mt="$2">
              PDV e crediário para sua loja
            </Text>
          </Box>
          <VStack space="md">
            <Text fontWeight="$medium">E-mail</Text>
            <Input>
              <InputField
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="voce@email.com"
              />
            </Input>
            <Text fontWeight="$medium">Senha</Text>
            <Input>
              <InputField
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
              />
            </Input>
            {err ? (
              <Text color="$red500" size="sm">
                {err}
              </Text>
            ) : null}
            {isMockMode() ? (
              <Text size="sm" color="$textLight500">
                Modo demo: demo@demo.com / demo
              </Text>
            ) : null}
            <Box alignItems="center" mt="$4">
              <AppButton
                disabled={loading}
                label={loading ? 'Entrando...' : 'Entrar'}
                onPress={onSubmit}
              />
            </Box>
            <Pressable onPress={() => router.push('/(auth)/register-company')}>
              <Text color="$primary500" textAlign="center" mt="$4">
                Criar empresa e conta
              </Text>
            </Pressable>
          </VStack>
        </VStack>
      </KeyboardAvoidingView>
    </Screen>
  );
}
