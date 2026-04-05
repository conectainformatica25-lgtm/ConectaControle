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
import { KeyboardAvoidingView, Platform, Pressable } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import * as authService from '@/services/authService';

export function RegisterCompanyScreen() {
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setErr(null);
    setLoading(true);
    try {
      await authService.registerCompany({
        companyName: companyName.trim(),
        slug: slug.trim() || undefined as any,
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      router.replace('/(app)/(tabs)');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro no cadastro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <VStack space="lg" py="$6">
          <Heading size="lg">Nova empresa</Heading>
          <VStack space="md">
            <Field label="Nome da loja" value={companyName} onChangeText={setCompanyName} />
            <Field label="Slug (opcional)" value={slug} onChangeText={setSlug} hint="URL amigável" />
            <Field label="Seu nome" value={fullName} onChangeText={setFullName} />
            <Field
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field label="Senha" value={password} onChangeText={setPassword} secure />
            {err ? (
              <Box bg="$red100" p="$3" rounded="$sm" mb="$2">
                <Text color="$red700" size="sm" fontWeight="$bold">
                  Erro: {err}
                </Text>
              </Box>
            ) : null}
            <AppButton
              disabled={loading}
              label={loading ? 'Criando...' : 'Criar Empresa e Conta'}
              onPress={onSubmit}
            />
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text color="$primary500" textAlign="center">
                Já tenho conta
              </Text>
            </Pressable>
          </VStack>
        </VStack>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  secure,
  keyboardType,
  autoCapitalize,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  keyboardType?: 'email-address';
  autoCapitalize?: 'none';
  hint?: string;
}) {
  return (
    <Box>
      <Text fontWeight="$medium" mb="$1">
        {label}
      </Text>
      <Input>
        <InputField
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
        />
      </Input>
      {hint ? (
        <Text size="xs" color="$textLight500" mt="$1">
          {hint}
        </Text>
      ) : null}
    </Box>
  );
}
