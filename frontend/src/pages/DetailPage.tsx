import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';

import { verifyDocument } from '@/lib/api';
import type {
  VerificationResults,
  VerificationStatus
} from '@/lib/api';

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

const DetailPage = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<VerificationResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /* Fetch verification                                               */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!documentId) {
      setError('Invalid document ID');
      setLoading(false);
      return;
    }

    verifyDocument(documentId)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [documentId]);

  /* ---------------------------------------------------------------- */
  /* States                                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading verification…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-destructive">{error ?? 'No data found'}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const { verification } = data;

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">

          {/* Back */}
          <button
            onClick={() => navigate('/results')}
            className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Batch Results
          </button>

          <h1 className="mb-6 text-2xl font-bold">
            Verification Details
          </h1>

          {/* Overall status */}
          <div className="mb-6 flex items-center gap-4 rounded-xl border bg-card p-6">
            <StatusBadge status={verification.overall_status} />
            <p className="text-sm text-muted-foreground">
              {verification.reason ?? '—'}
            </p>
          </div>

          {/* Arrears */}
          {verification.arrears?.length ? (
            <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/5 p-6">
              <h2 className="mb-2 font-semibold text-destructive">
                Arrear Subjects
              </h2>
              <ul className="list-disc pl-5 text-sm">
                {verification.arrears.map(code => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Mismatches */}
          {verification.mismatches?.length ? (
            <div className="overflow-hidden rounded-xl border bg-card">
              <table className="w-full">
                <thead className="border-b bg-secondary/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm">Subject</th>
                    <th className="px-6 py-3 text-left text-sm">Expected</th>
                    <th className="px-6 py-3 text-left text-sm">Found</th>
                  </tr>
                </thead>
                <tbody>
                  {verification.mismatches.map((m, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="px-6 py-4 font-medium">{m.subject}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {m.expected ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {m.found ?? m.issue ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-8">
            <Button variant="outline" onClick={() => navigate('/results')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Batch Results
            </Button>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DetailPage;
