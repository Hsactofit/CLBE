'use client'
/* eslint-disable react/no-unescaped-entities */

import React from 'react'
import Head from 'next/head'

function PrivacyPolicyPage() {
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      maxWidth: 860,
      margin: '0 auto',
      padding: '64px 20px',
    },
    title: {
      fontSize: 50,
      fontWeight: 700,
      marginBottom: 12,
    },
    meta: {
      color: '#64748b',
      fontSize: 14,
      marginBottom: 28,
    },
    section: {
      marginTop: 28,
    },
    h2: {
      fontSize: 40,
      color: '#4E6DBD',
      fontWeight: 600,
      marginBottom: 8,
      marginTop: 20,
    },
    h3: {
      fontSize: 30,
      color: '#4E6DBD',
      fontWeight: 600,
      marginBottom: 20,
      marginTop: 20,
    },
    p: {
      lineHeight: 1.6,
      fontSize: 16,
      color: '#111827',
      padding: '10px 0',
    },
  }

  return (
    <>
      <Head>
        <title>Privacy Policy • Crossing Legal AI</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main style={styles.container}>
        <h1 style={styles.title}>Privacy Policy</h1>
        <div style={styles.meta}>Last updated: 08/20/2025</div>
        <div>
          <h3 style={styles.h2}>1. Introduction</h3>
          <p style={styles.p}>
            At Crossing Legal AI ("we," "our," or "us"), we take your privacy seriously. This
            Privacy Policy explains how we collect, use, disclose, and safeguard your information
            when you use our website located at crossinglegal.ai (the "Sites") and the services we
            provide (the "Services").
          </p>
          <p style={styles.p}>
            We've written this policy to be clear and straightforward. If you have any questions
            after reading it, please contact us using the information in Section 13.
          </p>

          <h3 style={styles.h2}>2. Information We Collect</h3>

          <h3 style={styles.h3}>2.1 Information You Provide</h3>
          <p style={styles.p}>
            We collect the following information that you voluntarily provide to us:
          </p>
          <p style={styles.p}>
            Personal identification information includes your name, email address, phone number, and
            postal address. Immigration-related information includes your immigration status,
            citizenship information, travel history, and family information. We also collect
            application documents such as passports, birth certificates, marriage certificates, and
            financial records.
          </p>
          <p style={styles.p}>
            When necessary for immigration services, we may collect government-issued identifiers,
            including Social Security numbers, alien registration numbers, and passport numbers.
            Employment information we collect includes your work history, employer details, job
            titles, and income information. Educational information includes academic records,
            diplomas, certificates, and transcripts.
          </p>
          <p style={styles.p}>
            Financial information such as payment card details is processed through secure
            third-party providers. We also collect chat conversations and queries from messages you
            send through our chat features, account information including login credentials and
            preferences, and any other information you choose to provide when using our Services.
          </p>

          <h3 style={styles.h3}>2.2 Information Collected Automatically</h3>
          <p style={styles.p}>
            When you use our Sites and Services, we automatically collect certain information. This
            includes device information such as browser type, operating system, device type, IP
            address, and device identifiers. We collect usage data showing pages visited, features
            used, time spent, links clicked, and interactions with our Services.
          </p>
          <p style={styles.p}>
            We collect general location information based on your IP address (not precise GPS
            location), information about referring websites that show how you found our Sites, and
            session information about how you navigate through and use our Sites.
          </p>

          <h3 style={styles.h3}>2.3 Cookies and Similar Technologies</h3>
          <p style={styles.p}>
            We use cookies and similar tracking technologies to improve your experience, understand
            how you use our Sites, and provide personalized features. We use several types of
            cookies for different purposes.
          </p>
          <p style={styles.p}>
            <strong>Essential Cookies</strong> are required for basic website functionality and
            security. They last from a single session up to 1 year and cannot be disabled as they
            are necessary for site operation.
          </p>
          <p style={styles.p}>
            <strong>Functional Cookies</strong> remember your preferences and enhance your
            experience. They may last up to 2 years and can be disabled through cookie preferences.
          </p>
          <p style={styles.p}>
            <strong>Analytics Cookies</strong> help us understand how visitors use our website.
            These may last up to 2 years, are provided by services like Google Analytics, and can be
            disabled through cookie preferences.
          </p>
          <p style={styles.p}>
            <strong>Marketing Cookies</strong> are used to deliver personalized advertising. They
            may last up to 2 years and can be disabled through cookie preferences.
          </p>
          <p style={styles.p}>
            You can manage cookie preferences at any time through our Cookie Preferences Center. To
            opt out of specific cookie categories, visit our Cookie Settings page or adjust your
            browser settings.
          </p>

          <h3 style={styles.h2}>3. How We Use Your Information</h3>
          <p style={styles.p}>
            We use your information for various purposes related to providing and improving our
            Services. This includes helping you complete immigration forms and applications,
            enhancing features, fixing issues, and developing new offerings. We use your information
            to personalize your experience by tailoring content and recommendations based on your
            needs.
          </p>
          <p style={styles.p}>
            We process transactions to complete purchases and fulfill orders, provide customer
            support by responding to your inquiries and providing assistance, and communicate
            important notices, updates, and information about our Services. Your information helps
            us maintain security by protecting against fraud and unauthorized access.
          </p>
          <p style={styles.p}>
            We conduct analytics to understand usage patterns and improve our platform. If you've
            opted in, we may send marketing materials (with easy opt-out options). We also use your
            information for legal compliance to meet regulatory requirements and fulfill legal
            obligations.
          </p>
          <p style={styles.p}>
            We primarily use sensitive personal information (like immigration status or government
            IDs) only as needed to provide our Services. We do not use such information for
            marketing purposes.
          </p>

          <h3 style={styles.h2}>4. How We Share Your Information</h3>
          <p style={styles.p}>
            We take your privacy seriously and are selective about how we share your information.
          </p>

          <h3 style={styles.h3}>4.1 Service Providers</h3>
          <p style={styles.p}>
            We share information with trusted service providers who help us operate our business.
            This includes payment processors (e.g., Stripe, PayPal) to process payments, cloud
            hosting providers (e.g., Amazon Web Services, Google Cloud) to store data and host our
            Services, and customer support tools (e.g., Zendesk) to provide assistance.
          </p>
          <p style={styles.p}>
            We also share information with analytics providers (e.g., Google Analytics) to
            understand usage patterns, email service providers (e.g., SendGrid) to send
            communications, and marketing platforms to deliver relevant content (for users who opt
            in).
          </p>
          <p style={styles.p}>
            These service providers are contractually obligated to use your information only for the
            specific purposes we authorize and must protect your information according to our
            privacy standards.
          </p>

          <h3 style={styles.h3}>4.2 Legal Professionals</h3>
          <p style={styles.p}>
            If you request connection with immigration professionals, we will share necessary
            information with these professionals to facilitate their assistance. These professionals
            are bound by their own professional ethics and our confidentiality requirements.
          </p>

          <h3 style={styles.h3}>4.3 Government Entities</h3>
          <p style={styles.p}>
            We may share your information with government agencies (such as USCIS) when you request
            that we submit forms or applications on your behalf, when we are required to do so by
            law, legal process, or regulation, or when we need to verify information with government
            databases.
          </p>

          <h3 style={styles.h3}>4.4 Business Transfers</h3>
          <p style={styles.p}>
            If SkipLegal is involved in a merger, acquisition, or sale of all or part of its assets,
            your information may be transferred as part of that transaction. In such event, we will
            notify you via email and/or prominent notice on our Sites, explain what choices you have
            regarding your information, and ensure the new entity follows this Privacy Policy or
            gives you the option to delete or transfer your data.
          </p>

          <h3 style={styles.h3}>4.5 Legal Requirements</h3>
          <p style={styles.p}>
            We may disclose your information if required to do so by law or in response to valid
            requests by public authorities. If legally permitted, we will notify you of such
            requests and provide you with reasonable time to seek to modify or quash such requests
            before complying.
          </p>

          <h3 style={styles.h3}>4.6 With Your Consent</h3>
          <p style={styles.p}>
            We may share your information in any other circumstances where we have your explicit
            consent.
          </p>

          <h3 style={styles.h3}>4.7 What We Don't Do With Your Information</h3>
          <p style={styles.p}>
            We do not sell your personal information for profit or monetary transactions.
            Third-party use or disclosure of your information (including de-identified or anonymized
            data) is prohibited without your active consent. All third parties with whom we share
            your information are contractually bound to adhere to our privacy standards and these
            terms.
          </p>

          <h3 style={styles.h2}>5. Data Security</h3>
          <p style={styles.p}>
            We implement appropriate technical and organizational measures to protect your
            information. We use encryption for data in transit and at rest using industry-standard
            methods. We maintain strict access controls that limit who can access your information
            and conduct regular security assessments to evaluate our security practices.
          </p>
          <p style={styles.p}>
            Our team receives regular privacy and security training, and we maintain secure
            facilities with physical security measures for our offices and servers.
          </p>
          <p style={styles.p}>
            While we work hard to protect your information, no method of transmission over the
            internet or electronic storage is 100% secure. We cannot guarantee absolute security of
            your information.
          </p>

          <h3 style={styles.h3}>5.1 Data Breach Notification</h3>
          <p style={styles.p}>
            In the event of a data breach that affects your personal information, we will notify you
            via email promptly after discovery and confirmation of the breach. We will explain what
            happened and what information was affected, provide instructions on steps you should
            take to protect yourself, and inform you of measures we're taking to address the breach.
          </p>
          <p style={styles.p}>
            We will make every effort to provide this notification as quickly as possible in
            accordance with applicable laws and as necessary to determine the scope of the breach
            and restore reasonable integrity to our systems.
          </p>

          <h3 style={styles.h2}>6. Data Retention and Deletion</h3>

          <h3 style={styles.h3}>6.1 Retention Period</h3>
          <p style={styles.p}>
            We retain your information for as long as needed to provide our Services to you, comply
            with legal obligations, resolve disputes, and enforce our agreements. If your account
            becomes dormant (no activity for 24 months), we may archive or delete your information.
          </p>

          <h3 style={styles.h3}>6.2 Data Deletion Requests</h3>
          <p style={styles.p}>
            You have the right to request deletion of your personal information. To make this
            request, email support@crossinglegal.ai with subject line "Data Deletion Request." You
            will need to verify your identity when prompted and specify what information you want
            deleted.
          </p>
          <p style={styles.p}>
            We will process your deletion request within 30 days and send confirmation when
            completed. Some information may be retained if required by law or for legitimate
            business purposes.
          </p>

          <h3 style={styles.h2}>7. Your Rights and Choices</h3>
          <p style={styles.p}>You have several rights regarding your personal information.</p>

          <h3 style={styles.h3}>7.1 Access and Correction</h3>
          <p style={styles.p}>
            You can access and update most of your account information directly through your account
            settings. You may also request a copy of the personal information we hold about you by
            emailing support@crossinglegal.ai.
          </p>

          <h3 style={styles.h3}>7.2 Communication Preferences</h3>
          <p style={styles.p}>
            You can manage your communication preferences in several ways. You can opt out of
            marketing emails by clicking the "unsubscribe" link in any marketing email, adjust
            notification settings in your account preferences, or contact us directly to update your
            preferences.
          </p>

          <h3 style={styles.h3}>7.3 Cookie Management</h3>
          <p style={styles.p}>
            You can manage cookies through our Cookie Preferences Center, your browser settings, or
            opt-out tools provided by analytics services.
          </p>

          <h3 style={styles.h3}>7.4 Account Closure</h3>
          <p style={styles.p}>
            You can close your account at any time. Log into your account, go to Account Settings,
            select "Close Account," and follow the on-screen instructions. When closing your
            account, you'll have the option to download a copy of your personal data, request
            permanent deletion of your data, and receive confirmation when deletion is complete.
          </p>

          <h3 style={styles.h3}>7.5 Do Not Track</h3>
          <p style={styles.p}>
            Some browsers offer a "Do Not Track" feature that signals to websites you visit that you
            do not want to have your online activity tracked. Due to the lack of a consistent
            industry standard for interpreting these signals, our Sites do not currently respond to
            "Do Not Track" signals.
          </p>

          <h3 style={styles.h2}>8. California Privacy Rights</h3>
          <p style={styles.p}>
            If you are a California resident, the California Consumer Privacy Act (CCPA) provides
            you additional rights.
          </p>

          <h3 style={styles.h3}>8.1 Right to Know</h3>
          <p style={styles.p}>
            You have the right to request information about the personal information we've collected
            about you and how we've used and shared it. Specifically, you can request details about
            categories of personal information collected, sources of that information, purposes for
            collecting or selling that information, categories of third parties we share it with,
            and specific pieces of personal information we've collected.
          </p>

          <h3 style={styles.h3}>8.2 Right to Delete</h3>
          <p style={styles.p}>
            You have the right to request that we delete personal information we've collected from
            you, subject to certain exceptions.
          </p>

          <h3 style={styles.h3}>8.3 Right to Opt-Out of Sales</h3>
          <p style={styles.p}>
            We do not sell your personal information for monetary consideration. However, some
            sharing might be considered a "sale" under CCPA's broad definition. You have the right
            to opt out of such sharing.
          </p>

          <h3 style={styles.h3}>8.4 Right to Non-Discrimination</h3>
          <p style={styles.p}>
            We will not discriminate against you for exercising your CCPA rights.
          </p>

          <h3 style={styles.h3}>8.5 How to Exercise Your Rights</h3>
          <p style={styles.p}>
            To exercise your California privacy rights, email support@crossinglegal.ai or call
            1-844-475-4753. We will verify your identity before responding to your request. You may
            need to provide additional information for verification purposes.
          </p>

          <h3 style={styles.h2}>9. International Data Transfers</h3>
          <p style={styles.p}>
            Our services are primarily directed to users in the United States. If you access our
            Services from outside the United States, you understand that your information may be
            transferred to, stored, and processed in the United States and other countries where our
            servers are located.
          </p>
          <p style={styles.p}>
            These countries may have data protection laws different from your country. By using our
            Services, you consent to the transfer of your information to countries outside your
            country of residence, including the United States.
          </p>

          <h3 style={styles.h2}>10. Children's Privacy</h3>
          <p style={styles.p}>
            Our Services are not intended for children under 13, and we do not knowingly collect
            information from children under 13. If we learn that we have collected personal
            information from a child under 13, we will promptly delete that information.
          </p>
          <p style={styles.p}>
            If you believe we might have information from a child under 13, please contact us at
            support@crossinglegal.ai.
          </p>

          <h3 style={styles.h2}>11. Third-Party Links and Services</h3>
          <p style={styles.p}>
            Our Sites may contain links to third-party websites and services that are not owned or
            controlled by SkipLegal. We are not responsible for the privacy practices of these third
            parties. We encourage you to review the privacy policies of any third-party sites you
            visit.
          </p>

          <h3 style={styles.h2}>12. Changes to This Privacy Policy</h3>
          <p style={styles.p}>
            We may update this Privacy Policy from time to time. If we make material changes, we
            will post the new Privacy Policy on this page, update the "Last Updated" date at the
            top, notify you via email and/or prominent notice on our Sites, and obtain your active
            consent before implementing changes that significantly affect your privacy rights.
          </p>
          <p style={styles.p}>
            We will provide a plain-language summary of what has changed to help you understand the
            impact of any modifications.
          </p>

          <h3 style={styles.h2}>13. Contact Us</h3>
          <p style={styles.p}>
            If you have questions about this Privacy Policy or our privacy practices, please contact
            us at:
          </p>
          <p style={styles.p}>Email: support@crossinglegal.ai</p>
          <p style={styles.p}>Phone: 1-844-475-4753</p>
        </div>
      </main>
    </>
  )
}

export default PrivacyPolicyPage
