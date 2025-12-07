'use server';

export async function logToServer(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[CLIENT-LOG ${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}
