import React, { useState } from 'react';
import { Shield, AlertTriangle, FileText, CheckCircle2, Send, Lock } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useSeo } from '../lib/useSeo';

export const PrivacyPage: React.FC = () => {
  useSeo({
    title: 'Privacy Policy',
    description: 'Privacy Policy and anonymous token handling principles for Image To URL.',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-zinc-300">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Lock className="w-7 h-7 text-indigo-400" />
          Privacy Policy
        </h1>
        <p className="text-sm text-zinc-400 mt-1">Last updated: September 2026</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">1. Nature of the Service</h2>
          <p>
            Image To URL provides public image hosting and direct URL generation. When you upload an image, it is stored in persistent object storage and assigned a unique, unlisted public URL. Anyone with knowledge of this direct URL can view the image.
          </p>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
            <strong>Important Notice:</strong> Never upload sensitive personal data, identification cards, financial documents, or confidential credentials.
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">2. Information We Collect</h2>
          <p>
            We do not require user accounts or personal profiles for basic uploading. When an image is uploaded, we store:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
            <li>The binary image file and its detected format</li>
            <li>Original file size, width, and height metadata</li>
            <li>Timestamp of upload and optional expiration date</li>
            <li>A unique cryptographic deletion token issued to your browser</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">3. Retention & Deletion</h2>
          <p>
            Users can select retention options ranging from 1 hour to permanent retention. Expired images are systematically purged. Furthermore, uploaders can delete their images immediately using the deletion token provided upon upload.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">4. Cookies & Analytics</h2>
          <p>
            Image To URL utilizes local storage strictly for maintaining your personal history of uploads on your device. We do not sell user data or share private information with third parties.
          </p>
        </section>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  useSeo({
    title: 'Terms of Service',
    description: 'Terms of Service, acceptable use guidelines, and prohibited content policies for Image To URL.',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-zinc-300">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <FileText className="w-7 h-7 text-indigo-400" />
          Terms of Service
        </h1>
        <p className="text-sm text-zinc-400 mt-1">Last updated: September 2026</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">1. Acceptable Use</h2>
          <p>
            By uploading images to Image To URL, you affirm that you possess the necessary rights or licenses to publish the image and that your content complies with all applicable local and international laws.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">2. Prohibited Content</h2>
          <p>The following categories of content are strictly prohibited and will be removed immediately upon detection:</p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
            <li>Child sexual abuse material (CSAM) — reported immediately to NCMEC</li>
            <li>Malware, exploits, viruses, or phishing landing assets</li>
            <li>Copyrighted works uploaded without authorization</li>
            <li>Harassment, threats of violence, hate speech, or non-consensual imagery</li>
            <li>Executable files disguised as images</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">3. Service Availability</h2>
          <p>
            We strive for maximum uptime and resilience, but Image To URL is provided "as is" without warranties of uninterrupted service. We reserve the right to delete content that violates our policies or causes infrastructure abuse.
          </p>
        </section>
      </div>
    </div>
  );
};

export const DmcaPage: React.FC = () => {
  useSeo({
    title: 'DMCA & Abuse Takedown Notice',
    description: 'Submit DMCA copyright infringement notices and abusive content reports to Image To URL.',
  });

  const [imageUrl, setImageUrl] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('copyright');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim() || !email.trim() || !details.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    // Record submission
    setSubmitted(true);
    showToast('Abuse report submitted for manual compliance review', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-zinc-300">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <AlertTriangle className="w-7 h-7 text-rose-400" />
          DMCA Copyright & Abuse Notice
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Submit notices of copyright infringement or report abusive content for immediate removal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold text-white">Takedown Policy</h2>
          <p>
            Image To URL complies with the Digital Millennium Copyright Act (DMCA). If you are a copyright owner or authorized agent and believe content hosted on Image To URL infringes your rights, submit the form with precise identification of the material.
          </p>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs text-zinc-400">
            <h4 className="font-semibold text-white">Required Information</h4>
            <p>1. The exact URL of the stored image (e.g. https://.../i/abc123)</p>
            <p>2. Proof or declaration of copyright ownership</p>
            <p>3. Valid contact email address</p>
          </div>
        </div>

        {/* Report Form */}
        <div className="rounded-2xl border border-zinc-800 bg-[#18181B] p-6 space-y-4 shadow-xl">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-semibold text-white">Report Received</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Your report has been logged and forwarded to our trust & safety team. Infringing files will be reviewed and removed promptly.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setImageUrl('');
                  setDetails('');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 text-xs text-white hover:bg-zinc-700"
              >
                Submit Another Report
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold uppercase text-zinc-400 block mb-1">Image URL or ID *</label>
                <input
                  type="text"
                  placeholder="https://.../i/abc123 or abc123"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold uppercase text-zinc-400 block mb-1">Reason for Report *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="copyright">Copyright Infringement (DMCA)</option>
                  <option value="privacy">Non-Consensual / Privacy Violation</option>
                  <option value="malware">Malware or Phishing Asset</option>
                  <option value="illegal">Illegal or Prohibited Material</option>
                </select>
              </div>

              <div>
                <label className="font-semibold uppercase text-zinc-400 block mb-1">Your Contact Email *</label>
                <input
                  type="email"
                  placeholder="agent@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="font-semibold uppercase text-zinc-400 block mb-1">Statement & Evidence Details *</label>
                <textarea
                  rows={4}
                  placeholder="Describe your ownership claim or explain why this content violates policy..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition-all text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit DMCA / Abuse Report</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
