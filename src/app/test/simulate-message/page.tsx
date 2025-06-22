'use client';

import { useState } from 'react';

export default function SimulateMessagePage() {
    const [transactionId, setTransactionId] = useState('690d3a1d-6201-4c83-8893-c97e67aa4b27');
    const [status, setStatus] = useState('pending_user_transfer_start');

    const simulateMoneyGramMessage = () => {
        const message = {
            transaction: {
                id: transactionId,
                status: status,
                amount: '1',
                asset: 'USDC'
            }
        };

        console.log('Simulating MoneyGram postMessage:', message);
        
        // Simulate postMessage from MoneyGram
        window.postMessage(message, '*');
        
        alert('PostMessage simulated! Check the console and webview.');
    };

    const simulateDirectMessage = () => {
        const message = {
            id: transactionId,
            status: status,
            amount: '1',
            asset: 'USDC'
        };

        console.log('Simulating direct postMessage:', message);
        
        // Simulate postMessage with different structure
        window.postMessage(message, '*');
        
        alert('Direct postMessage simulated! Check the console and webview.');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Simulate MoneyGram PostMessage</h1>
                
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Transaction ID:
                        </label>
                        <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status:
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="incomplete">incomplete</option>
                            <option value="pending_user_transfer_start">pending_user_transfer_start</option>
                            <option value="pending_user_transfer_complete">pending_user_transfer_complete</option>
                            <option value="completed">completed</option>
                            <option value="error">error</option>
                        </select>
                    </div>
                    
                    <div className="space-y-3">
                        <button
                            onClick={simulateMoneyGramMessage}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Simulate MoneyGram Message (with transaction wrapper)
                        </button>
                        
                        <button
                            onClick={simulateDirectMessage}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Simulate Direct Message (without transaction wrapper)
                        </button>
                    </div>
                    
                    <div className="mt-6 p-4 bg-gray-50 rounded">
                        <h3 className="font-semibold mb-2">Instructions:</h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                            <li>Open the MoneyGram webview in another tab</li>
                            <li>Come back to this page</li>
                            <li>Click one of the simulate buttons</li>
                            <li>Check the console for logs</li>
                            <li>Check if the webview responds</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
} 