import { Info } from "lucide-react";

export default function DevOtpBanner({ otp }) {
  if (!otp) return null;
  return (
    <div
      data-testid="dev-otp-banner"
      className="mx-6 mt-2 mb-4 flex items-start gap-3 rounded-2xl bg-blue-600/15 border border-blue-400/30 px-4 py-3 text-sm text-blue-100"
    >
      <Info className="h-4 w-4 mt-0.5 text-blue-300 shrink-0" />
      <div>
        <div className="font-semibold text-blue-200">DEV MODE OTP</div>
        <div className="font-mono tracking-widest text-lg text-white mt-0.5" data-testid="dev-otp-value">
          {otp}
        </div>
        <div className="text-xs text-blue-200/80 mt-1">
          Auto-filled for you. Switch OTP_DEV_MODE=false in .env to send real SMS via MSG91.
        </div>
      </div>
    </div>
  );
}
