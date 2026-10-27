export default function PaymentResult({searchParams}:{searchParams:Promise<{result?:string}>}) {
 return <main className="auth-shell"><section className="panel narrow"><p className="eyebrow">MASJID COMMUNITY</p><h1>Payment status</h1><p>Payment confirmation is provided after our payment processor verifies the charge. Return to your account to view the final donation status and receipt.</p><a className="secondary" href="/">Return to the portal</a></section></main>;
}
