import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/store/authStore';
import { updateCompany } from '@/services/mock/memoryStore';
import { Box, Heading, HStack, Text, VStack, Divider } from '@gluestack-ui/themed';
import { useState } from 'react';
import { Alert } from 'react-native';

export function SubscriptionScreen() {
  const company = useAuthStore((s) => s.company);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!company) return null;

  const now = new Date();
  const expiresAt = company.status === 'trial' ? new Date(company.trial_ends_at) : (company.expires_at ? new Date(company.expires_at) : now);
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = diffDays <= 0;

  async function handlePay() {
    setLoading(true);
    // Simulating PagSeguro API call
    setTimeout(() => {
      setLoading(false);
      setShowQR(true);
    }, 1500);
  }

  async function confirmPayment() {
    if (!company) return;
    setLoading(true);
    // Simulating Webhook/Confirmation
    setTimeout(() => {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);
      
      const updatedCompany = {
        ...company,
        status: 'active' as const,
        expires_at: newExpiry.toISOString()
      };

      // Update local store/mock
      updateCompany(company.id, updatedCompany);
      
      // Update global state
      useAuthStore.getState().setSession({
        profile: useAuthStore.getState().profile,
        company: updatedCompany
      });

      setLoading(false);
      setShowQR(false);
      Alert.alert('Sucesso', 'Seu pagamento foi confirmado! Assinatura ativa por mais 30 dias.');
    }, 2000);
  }

  return (
    <Screen scroll>
      <VStack space="xl" py="$6">
        <Box>
          <Heading size="xl" color="$primary500">Assinatura</Heading>
          <Text color="$textLight500">Gerencie seu acesso ao ConectaControle</Text>
        </Box>

        <Box bg="$white" p="$5" borderRadius="$xl" borderWidth={1} borderColor="$borderLight50">
          <VStack space="md">
            <HStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="$bold">Status atual:</Text>
              <Box bg={company.status === 'active' ? '$green100' : (isExpired ? '$red100' : '$blue100')} px="$3" py="$1" borderRadius="$full">
                <Text size="xs" fontWeight="$bold" color={company.status === 'active' ? '$green700' : (isExpired ? '$red700' : '$blue700')}>
                  {company.status === 'trial' ? 'TESTE GRÁTIS' : (company.status === 'active' ? 'ATIVO' : 'EXPIRADO')}
                </Text>
              </Box>
            </HStack>
            
            <HStack justifyContent="space-between">
              <Text color="$textLight500">Validade:</Text>
              <Text fontWeight="$bold">
                {isExpired ? 'Expirado' : `${diffDays} dias restantes`}
              </Text>
            </HStack>

            <Divider my="$2" />
            
            <Text size="sm" color="$textLight500">
               {company.status === 'trial' 
                 ? 'Aproveite seus 7 dias de teste gratuito para conhecer todas as ferramentas.'
                 : 'Sua assinatura mensal garante acesso ilimitado ao PDV, estoque e relatórios.'}
            </Text>
          </VStack>
        </Box>

        {!showQR ? (
          <VStack space="md">
            <Box bg="$primary50" p="$4" borderRadius="$lg" borderWidth={1} borderColor="$primary200">
              <VStack space="xs">
                <Text fontWeight="$bold" color="$primary700">Plano Mensal Profissional</Text>
                <Text size="sm" color="$primary600">Acesso completo por apenas R$ 49,90/mês</Text>
              </VStack>
            </Box>
            
            <AppButton 
              label={loading ? 'Processando...' : 'Ativar Assinatura (Mês)'} 
              onPress={handlePay}
              disabled={loading}
            />
          </VStack>
        ) : (
          <VStack space="xl" alignItems="center" bg="$white" p="$6" borderRadius="$xl" borderWidth={1} borderColor="$primary200">
            <Heading size="md">Pagamento via PIX</Heading>
            <Box bg="$gray100" w={200} h={200} justifyContent="center" alignItems="center" borderRadius="$lg">
               <Text textAlign="center" size="xs" color="$textLight400">[QR CODE PIX PAGSEGURO]</Text>
            </Box>
            <Text textAlign="center" size="sm" color="$textLight600">
              Escaneie o código acima no app do seu banco para ativar sua conta instantaneamente.
            </Text>
            <AppButton 
              label={loading ? 'Verificando...' : 'Já realizei o pagamento'} 
              onPress={confirmPayment}
              disabled={loading}
            />
            <Text size="xs" color="$primary500" onPress={() => setShowQR(false)}>
              Voltar
            </Text>
          </VStack>
        )}

        <Box alignItems="center" mt="$4">
           <Text size="xs" color="$textLight400" textAlign="center">
             Pagamento processado com segurança via PagSeguro.
           </Text>
        </Box>
      </VStack>
    </Screen>
  );
}
