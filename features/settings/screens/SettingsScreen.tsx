import { Box, Heading, Input, InputField, Text, VStack } from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import * as authService from '@/services/authService';
import * as companyService from '@/services/companyService';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';

export function SettingsScreen() {
  const profile = useAuthStore((s) => s.profile);
  const company = useAuthStore((s) => s.company);
  const setSession = useAuthStore((s) => s.setSession);
  const signOutLocal = useAuthStore((s) => s.signOutLocal);
  const setBrand = useThemeStore((s) => s.setBrand);

  const [primary, setPrimary] = useState(company?.brand_primary ?? '');
  const [secondary, setSecondary] = useState(company?.brand_secondary ?? '');
  const [users, setUsers] = useState<{ id: string; full_name: string | null; role: string }[]>([]);

  useEffect(() => {
    companyService.listProfilesForCompany().then(setUsers).catch(() => {});
  }, []);

  async function saveBranding() {
    if (!company) return;
    await companyService.updateCompanyBranding(company.id, {
      brand_primary: primary || null,
      brand_secondary: secondary || null,
      low_stock_threshold: company.low_stock_threshold,
    });
    setBrand({ primary: primary || undefined, secondary: secondary || undefined });
    const c = await authService.fetchCompany(company.id);
    if (c && profile) setSession({ profile, company: c });
  }

  async function signOut() {
    await authService.signOut();
    signOutLocal();
    router.replace('/(auth)/login');
  }

  return (
    <Screen scroll>
      <VStack space="lg" py="$4">
        <Heading size="lg">Configurações</Heading>
        <Box>
          <Text fontWeight="$bold">Conta</Text>
          <Text>{profile?.full_name}</Text>
          <Text size="sm" color="$textLight500">
            {profile?.role}
          </Text>
        </Box>
        <Box>
          <Text fontWeight="$bold" mb="$2">
            Cores da empresa (multi-tenant)
          </Text>
          <Input mb="$2">
            <InputField placeholder="Primária #2563eb" value={primary} onChangeText={setPrimary} />
          </Input>
          <Input mb="$2">
            <InputField placeholder="Secundária" value={secondary} onChangeText={setSecondary} />
          </Input>
          <AppButton label="Salvar marca" onPress={saveBranding} />
        </Box>
        <Box>
          <Text fontWeight="$bold" mb="$2">
            Equipe
          </Text>
          {users.map((u) => (
            <Text key={u.id} mb="$1">
              {u.full_name ?? u.id} — {u.role}
            </Text>
          ))}
          <Text size="sm" color="$textLight500" mt="$2">
            Novos usuários podem ser convidados pelo painel Supabase ou fluxo futuro de convite.
          </Text>
        </Box>
        <AppButton variant="outline" label="Sair" onPress={signOut} />
      </VStack>
    </Screen>
  );
}
