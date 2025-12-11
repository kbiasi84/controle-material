import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Button,
    Hr,
    Img,
} from '@react-email/components'

interface ResetEmailProps {
    resetLink: string
    userName?: string
}

export function ResetEmail({ resetLink, userName }: ResetEmailProps) {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Text style={logoText}>📦 SCMP</Text>
                        <Text style={logoSubtext}>Sistema de Controle de Materiais</Text>
                    </Section>

                    <Hr style={hr} />

                    {/* Content */}
                    <Section style={content}>
                        <Text style={greeting}>
                            Olá{userName ? `, ${userName}` : ''}!
                        </Text>

                        <Text style={paragraph}>
                            Recebemos uma solicitação para redefinir a senha da sua conta no SCMP.
                        </Text>

                        <Text style={paragraph}>
                            Clique no botão abaixo para criar uma nova senha:
                        </Text>

                        <Section style={buttonContainer}>
                            <Button style={button} href={resetLink}>
                                Redefinir Minha Senha
                            </Button>
                        </Section>

                        <Text style={warning}>
                            ⚠️ Este link expira em <strong>1 hora</strong>.
                        </Text>

                        <Text style={paragraph}>
                            Se você não solicitou a recuperação de senha, ignore este e-mail.
                            Sua conta permanecerá segura.
                        </Text>
                    </Section>

                    <Hr style={hr} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            Este é um e-mail automático. Por favor, não responda.
                        </Text>
                        <Text style={footerText}>
                            © 2025 SCMP - Sistema de Controle de Materiais Policiais
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    )
}

// Estilos
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
}

const header = {
    padding: '32px 48px 24px',
    textAlign: 'center' as const,
}

const logoText = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1e40af',
    margin: '0',
}

const logoSubtext = {
    fontSize: '14px',
    color: '#64748b',
    margin: '4px 0 0',
}

const hr = {
    borderColor: '#e6ebf1',
    margin: '0 48px',
}

const content = {
    padding: '32px 48px',
}

const greeting = {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 16px',
}

const paragraph = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#475569',
    margin: '0 0 16px',
}

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
}

const button = {
    backgroundColor: '#2563eb',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 32px',
}

const warning = {
    fontSize: '14px',
    color: '#b45309',
    backgroundColor: '#fef3c7',
    padding: '12px 16px',
    borderRadius: '6px',
    margin: '0 0 16px',
    textAlign: 'center' as const,
}

const footer = {
    padding: '24px 48px',
}

const footerText = {
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'center' as const,
    margin: '0 0 4px',
}

export default ResetEmail
