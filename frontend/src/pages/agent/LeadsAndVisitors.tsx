import { useLanguage } from '../../contexts/LanguageContext';
import LeadsAndVisitorsSection from './LeadsAndVisitorsSection';
import {
  agentEyebrowStyle,
  agentHeaderInnerStyle,
  agentSubtitleStyle,
  agentTitleStyle,
  agentWorkspace,
} from './agentWorkspaceTheme';

const LeadsAndVisitors = () => {
  const { t } = useLanguage();

  return (
    <div
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        background: agentWorkspace.pageBg,
        color: agentWorkspace.text,
        minHeight: '100vh',
        padding: 0,
      }}
    >
      <div style={{ background: agentWorkspace.headerBg, borderBottom: `1px solid ${agentWorkspace.border}` }}>
        <div style={agentHeaderInnerStyle}>
          <div>
            <div style={agentEyebrowStyle}>{t('agent.workspace')}</div>
            <h1 style={agentTitleStyle}>{t('agent.leads.title')}</h1>
            <p style={agentSubtitleStyle}>{t('agent.leads.subtitle')}</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: agentWorkspace.maxContent, margin: '24px auto 40px', padding: '0 20px' }}>
        <LeadsAndVisitorsSection showStats embedded={false} />
      </div>
    </div>
  );
};

export default LeadsAndVisitors;
