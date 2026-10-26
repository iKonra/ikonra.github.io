import { useI18n } from '../i18n/I18nProvider'
import ScrollVelocity from '../components/ScrollVelocity'

export default function Skills() {
  const { t } = useI18n()
  return (
    <section className="skills" aria-label={t.skills.kicker}>
      <ScrollVelocity text={t.skills.row1} baseVelocity={2.5} />
      <ScrollVelocity text={t.skills.row2} baseVelocity={-2.5} />
    </section>
  )
}
