import { useI18n } from '../i18n/I18nProvider'
import ScrollVelocity from '../components/ScrollVelocity'

export default function Skills() {
  const { t } = useI18n()
  return (
    <section className="band" aria-label="Stack">
      <p className="sr-only">{t.stack}</p>
      <ScrollVelocity text={t.stack} baseVelocity={2} />
    </section>
  )
}
