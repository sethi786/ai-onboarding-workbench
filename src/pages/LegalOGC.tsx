import { TeamLensPage } from '../features/selfEval/TeamLensPage';

export default function LegalOGC() {
  return (
    <TeamLensPage
      teamIds={['legal']}
      title="Legal / OGC"
      intro="What Legal / Office of General Counsel reviews: vendor and client contracts, IP ownership, liability, DPAs, and regulatory obligations."
    />
  );
}
