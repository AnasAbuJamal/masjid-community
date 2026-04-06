# COST ESTIMATE - Masjid Management Platform

**Last Updated:** March 22, 2026  
**Currency:** USD

---

## Executive Summary

| Tier | Monthly Cost | Suitable For |
|------|-------------|--------------|
| **Starter (Free)** | $0 | Small masjids, testing |
| **Growth** | ~$25-75 | Growing communities |
| **Scale** | ~$100-200 | Established organizations |

---

## Detailed Cost Breakdown

### 1. Core Infrastructure

#### Database: MongoDB Atlas

| Tier | Price | Notes |
|------|-------|-------|
| M0 (Free) | $0/mo | 512 MB storage, shared RAM |
| M2 | $9/mo | 2 GB storage, shared RAM |
| M5 | $25/mo | 10 GB storage, 1 GB RAM |
| M10 | $56/mo | 20 GB storage, 2 GB RAM |

**Recommendation:** Start with **M0 Free** tier for development/testing. Upgrade to **M5** ($25/mo) for production with up to 1,000 active users.

#### Web Hosting: Vercel

| Tier | Price | Notes |
|------|-------|-------|
| Hobby (Free) | $0/mo | 100GB bandwidth, limited functions |
| Pro | $20/mo | 1TB bandwidth, unlimited functions |

**Recommendation:** **Hobby (Free)** tier is sufficient for most masjids with up to 10,000 monthly visitors. Upgrade to **Pro** ($20/mo) if exceeding bandwidth limits.

### 2. Payment Processing: Stripe

| Fee Type | Rate | Notes |
|----------|------|-------|
| Online transactions | 2.9% + $0.30 | Per successful charge |
| Domestic cards | 2.9% + $0.30 | Most common |
| International cards | 3.9% + $0.30 | Currency conversion |

**Example Calculations:**

| Monthly Donations | Stripe Fees | Net to Masjid |
|-------------------|-------------|---------------|
| $1,000 | $37.40 | $962.60 |
| $5,000 | $187.40 | $4,812.60 |
| $10,000 | $374.40 | $9,625.60 |

**Recommendation:** Stripe fees are standard industry rates. No monthly subscription needed.

### 3. Mobile App Distribution

#### Apple Developer Program

| Item | Cost | Notes |
|------|------|-------|
| Annual membership | $99/year | Required for App Store |
| Monthly equivalent | ~$8.25/mo | Can submit unlimited apps |

#### Google Play Developer Account

| Item | Cost | Notes |
|------|------|-------|
| Lifetime registration | $25 (one-time) | One-time fee, forever |

**Recommendation:** Budget **$100/year** ($8.33/mo) for Apple, **$25 one-time** for Google.

### 4. Domain & Email

#### Domain Registration

| Registrar | .org Price | Notes |
|-----------|------------|-------|
| Namecheap | ~$12/year | $0.88/mo |
| Google Domains | ~$12/year | $0.88/mo |
| Cloudflare | ~$9/year | $0.75/mo |

#### Email Service (Optional)

| Provider | Free Tier | Paid Plans |
|----------|-----------|-------------|
| Zoho Mail | 5 users free | From $1/mo/user |
| Google Workspace | - | $6/user/mo |
| Microsoft 365 | - | $5/user/mo |

**Recommendation:** 
- Domain: ~$1/mo (Cloudflare)
- Email: Start with **Zoho Mail Free** for up to 5 users

### 5. Monitoring & Analytics

| Service | Free Tier | Paid Plans |
|---------|-----------|-------------|
| Vercel Analytics | Included | - |
| MongoDB Atlas Analytics | Included | - |
| Sentry | 5k errors/mo | From $26/mo |
| Datadog | 1 host free | From $15/host/mo |

**Recommendation:** Start with **free tiers only** - they provide sufficient monitoring for most masjids.

---

## Monthly Cost Scenarios

### Scenario 1: Starter (Free Tier)

| Service | Monthly Cost |
|---------|-------------|
| MongoDB Atlas (M0) | $0 |
| Vercel (Hobby) | $0 |
| Domain (Cloudflare) | $1 |
| Email (Zoho Free) | $0 |
| **TOTAL** | **$1/month** |

**Includes:**
- Up to 512 MB database storage
- 100 GB web bandwidth
- Basic features
- Community support

---

### Scenario 2: Growth Tier

| Service | Monthly Cost |
|---------|-------------|
| MongoDB Atlas (M5) | $25 |
| Vercel (Hobby) | $0 |
| Domain (Cloudflare) | $1 |
| Email (Zoho - 5 users) | $5 |
| **TOTAL** | **$31/month** |

**Includes:**
- Up to 10 GB database storage
- 100 GB web bandwidth
- Premium features
- Priority support
- Email for 5 staff members

---

### Scenario 3: Scale Tier

| Service | Monthly Cost |
|---------|-------------|
| MongoDB Atlas (M10) | $56 |
| Vercel (Pro) | $20 |
| Domain (Cloudflare) | $1 |
| Email (Google Workspace - 10 users) | $60 |
| Apple Developer | $8 |
| **TOTAL** | **$145/month** |

**Includes:**
- Up to 20 GB database storage
- Unlimited web bandwidth
- All premium features
- Priority support
- Enterprise-grade email
- Mobile app in stores

---

### Scenario 4: With Transaction Costs

Assuming **$5,000/month** in donations:

| Category | Monthly Cost |
|----------|-------------|
| Base Infrastructure | $31 |
| Stripe Fees (2.9% + $0.30) | ~$187 |
| **TOTAL** | **~$218/month** |

---

## Annual Cost Summary

| Tier | Monthly | Annual (Prepaid) | Savings |
|------|---------|------------------|---------|
| Starter | $1 | $12 | - |
| Growth | $31 | $360 | - |
| Scale | $145 | $1,700 | - |
| Apple Developer | $8 | $99/year | - |

---

## Cost Optimization Tips

### 1. Minimize Database Costs
- Enable auto-archiving for old data
- Use appropriate indexes
- Monitor storage usage
- Set up cleanup jobs for logs

### 2. Reduce Web Hosting Costs
- Optimize images (WebP format)
- Enable caching headers
- Use CDN for static assets
- Monitor bandwidth usage

### 3. Lower Payment Processing Fees
- Encourage ACH transfers for large donations (0.8% cap)
- Set minimum donation amount ($5+)
- Provide "cover fees" option

### 4. Free Alternatives

| Paid Service | Free Alternative |
|--------------|------------------|
| Google Workspace | Zoho Mail, ProtonMail |
| Datadog | Vercel built-in analytics |
| Sentry | Manual error monitoring |
| GitHub Copilot | Free AI tools |

---

## Revenue Considerations

### Potential Revenue Streams

| Source | Potential Monthly | Notes |
|--------|-------------------|-------|
| Donations | $1,000-10,000+ | Platform enables easy giving |
| Membership fees | $500-5,000 | Optional premium features |
| Event tickets | $200-2,000 | Built-in RSVP system |
| Zakat/Sadaqah | Seasonal peaks | Ramadan can 10x donations |

### ROI Analysis

**Example:** A masjid spending **$31/month** on this platform:

- If platform helps collect **$500 additional/month** in donations
- Net benefit: **$469/month** ($469 × 12 = $5,628/year)
- ROI: **1,516%**

---

## Hidden/One-Time Costs

| Item | Cost | When |
|------|------|------|
| Logo/branding design | $0-500 | Initial setup |
| Mobile app icons | $0-200 | Initial setup |
| Developer help (optional) | $0-5,000 | If not self-hosting |
| SSL certificate (if not using Vercel) | $0-200/year | Usually free with hosting |

---

## Comparison with Alternatives

| Platform | Monthly Cost | Features | Notes |
|----------|-------------|----------|-------|
| **Our Platform** | $1-145 | Full suite | Custom-built |
| Sharity | $99+ | Basic | Limited features |
| Ga级 | $49+ | Basic | Generic |
| Custom development | $5,000+ | Variable | Expensive |

**Our platform offers the best value** - enterprise features at starter-tier pricing.

---

## Budget Recommendations

### Small Masjid (Under 100 Families)

| Priority | Service | Cost |
|----------|---------|------|
| Must Have | MongoDB M0, Vercel Hobby | $0 |
| Nice to Have | Domain, Zoho email | $1-5 |
| **Total** | | **$0-6/month** |

### Medium Masjid (100-500 Families)

| Priority | Service | Cost |
|----------|---------|------|
| Must Have | MongoDB M5, Vercel | $25 |
| Nice to Have | Domain, Email, Monitoring | $10 |
| **Total** | | **$35/month** |

### Large Masjid (500+ Families)

| Priority | Service | Cost |
|----------|---------|------|
| Must Have | MongoDB M10, Vercel Pro | $76 |
| Nice to Have | Full email, Mobile apps, Support | $70 |
| **Total** | | **~$145/month** |

---

## Final Recommendations

### For New Deployments:

1. **Start FREE** - Use M0 + Hobby tier
2. **Monitor usage** - Watch for bottlenecks
3. **Upgrade only when needed** - Don't overprovision
4. **Enable analytics** - Track what's being used

### For Existing Deployments:

1. **Review actual usage** vs. projected
2. **Optimize queries** before upgrading
3. **Consider annual plans** for 20% savings
4. **Negotiate with providers** for non-profits

---

## Cost Calculator

Use this formula to estimate your monthly cost:

```
Base Cost = MongoDB ($0-$56) + Hosting ($0-$20) + Domain ($1) + Email ($0-$60) + Apple Dev ($8 optional)

Total = Base Cost + (Monthly Transactions × 0.029) + (Transaction Count × $0.30)
```

**Example calculation for your deployment:**

```
MongoDB: $25
Vercel: $0
Domain: $1
Email: $0
Stripe (500 tx × $50 avg): $750 × 0.029 = $21.75 + 500 × $0.30 = $171.75

Total: $25 + $0 + $1 + $21.75 = $47.75/month
```

---

## Questions & Support

For cost optimization advice or custom quotes:
- Open a GitHub Discussion
- Contact your hosting provider
- Consult with your IT team

---

**Bottom Line:** This platform can run for as little as **$1/month** (plus Stripe fees) while providing enterprise-grade features for managing your masjid.
