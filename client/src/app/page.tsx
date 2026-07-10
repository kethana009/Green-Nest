'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Splash() {
    const router = useRouter();

    useEffect(() => {
        // 2.5 seconds tarvatha home ki vellali
        const timer = setTimeout(() => {
            router.push('/home');
        }, 2500);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div style={styles.container}>
            <h1 style={styles.logo}>🌱 GREEN NEST</h1>
            <p style={styles.tagline}>Breathe Better, Live Greener</p>
        </div>
    );
}

const styles: any = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #2d5016 0%, #4a7c2a 100%)',
    },
    logo: {
        fontSize: '48px',
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: '4px',
        marginBottom: '10px',
        animation: 'fadeIn 1s ease-in'
    },
    tagline: {
        fontSize: '16px',
        color: 'rgba(255,255,255,0.8)',
        animation: 'fadeIn 1.5s ease-in'
    }
};