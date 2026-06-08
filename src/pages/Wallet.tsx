import Container from '../components/Container'
import { Label } from '../components/ui'
import Coin from '../components/Coin'
import WalletLedger from '../components/WalletLedger'
import { useLang } from '../lib/i18n'

export default function Wallet() {
  const { t } = useLang()

  return (
    <Container className="animate-fade-up">
      <header className="mb-5">
        <Label>{t('wallet.money')}</Label>
        <h1 className="font-pixel mt-1 flex items-center gap-2 text-2xl font-bold text-[color:var(--color-ink)]">
          <Coin className="h-6 w-6" /> {t('wallet.title')}
        </h1>
      </header>

      <WalletLedger />
    </Container>
  )
}
