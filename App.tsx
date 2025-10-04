
import React, { useState, createContext, useEffect } from 'react';
import { MOCK_USERS, MOCK_TRANSACTIONS, generateMockCard, generateMockLoan, generateAccountNumber } from './constants';
import { User, Transaction, Card, Loan } from './types';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { AnimatePresence, motion } from 'framer-motion';
import { WelcomeScreen } from './components/OnboardingScreen'; // Repurposed as WelcomeScreen
import { RegisterScreen } from './components/DataScreen'; // Repurposed as RegisterScreen

export interface CardApplicationDetails {
    fullName: string;
    address: string;
    dateOfBirth: string;
    employmentStatus: string;
    employer: string;
    annualIncome: number;
}

export interface LoanApplicationDetails extends CardApplicationDetails {
    loanAmount: number;
    loanTerm: number;
}

interface BankContextType {
    currentUser: User | null;
    users: User[];
    transactions: Transaction[];
    login: (username: string, pin: string) => boolean;
    logout: () => void;
    registerUser: (name: string, username: string, pin: string) => boolean;
    transferMoney: (recipientIdentifier: string, amount: number) => { success: boolean; message: string };
    addCardToUser: (details: CardApplicationDetails) => { success: boolean; message: string; newCard?: Card };
    addLoanToUser: (details: LoanApplicationDetails) => { success: boolean; message: string; newLoan?: Loan };
    requestPaymentExtension: (accountId: string, type: 'card' | 'loan') => { success: boolean; message: string; newDueDate?: string };
}

export const BankContext = createContext<BankContextType>(null!);

const initialUsers = (): User[] => {
    try {
        const saved = localStorage.getItem('gemini-bank-users');
        return saved ? JSON.parse(saved) : MOCK_USERS;
    } catch (e) {
        console.error("Failed to load users, falling back to mock data.", e);
        return MOCK_USERS;
    }
};

const initialTransactions = (): Transaction[] => {
    try {
        const saved = localStorage.getItem('gemini-bank-transactions');
        return saved ? JSON.parse(saved) : MOCK_TRANSACTIONS;
    } catch (e) {
        console.error("Failed to load transactions, falling back to mock data.", e);
        return MOCK_TRANSACTIONS;
    }
};

type AuthScreen = 'welcome' | 'login' | 'register';

export default function App() {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome');

    useEffect(() => {
        localStorage.setItem('gemini-bank-users', JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        localStorage.setItem('gemini-bank-transactions', JSON.stringify(transactions));
    }, [transactions]);


    const login = (username: string, pin: string): boolean => {
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        setAuthScreen('welcome');
    };

    const registerUser = (name: string, username: string, pin: string): boolean => {
        const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (existingUser) {
            return false; // Username taken
        }

        const newUser: User = {
            id: users.length + 1,
            name,
            username,
            pin,
            balance: 1000, // Starting balance
            savingsAccountNumber: generateAccountNumber(),
            avatarUrl: `https://picsum.photos/seed/${username}/100`,
            cards: [generateMockCard()],
            loans: [],
        };

        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        setCurrentUser(newUser); // Auto-login after registration
        return true;
    }

    const transferMoney = (recipientIdentifier: string, amount: number): { success: boolean; message: string } => {
        if (!currentUser) return { success: false, message: 'Error: You are not logged in.' };
        if (amount <= 0) return { success: false, message: 'Error: Payment amount must be positive.' };

        const senderIndex = users.findIndex(u => u.id === currentUser.id);
        
        const recipientIndex = users.findIndex(u =>
            u.name.toLowerCase() === recipientIdentifier.toLowerCase() ||
            u.name.split(' ')[0].toLowerCase() === recipientIdentifier.toLowerCase() ||
            u.savingsAccountNumber === recipientIdentifier
        );

        if (recipientIndex === -1) return { success: false, message: `Error: Contact or account "${recipientIdentifier}" not found.` };
        
        const sender = users[senderIndex];
        const recipient = users[recipientIndex];

        if (sender.id === recipient.id) return { success: false, message: 'Error: Cannot send money to yourself.' };
        if (sender.balance < amount) return { success: false, message: `Error: Insufficient funds. Your balance is $${sender.balance.toFixed(2)}.` };

        const newUsers = [...users];
        newUsers[senderIndex] = { ...sender, balance: sender.balance - amount };
        newUsers[recipientIndex] = { ...recipient, balance: recipient.balance + amount };
        setUsers(newUsers);
        setCurrentUser(newUsers[senderIndex]);

        const newTransactionId = `t${transactions.length + 1}`;
        const timestamp = new Date().toISOString();

        const senderTransaction: Transaction = {
            id: newTransactionId,
            userId: sender.id,
            type: 'debit',
            amount,
            description: `Payment to ${recipient.name}`,
            timestamp,
            partyName: recipient.name,
            category: 'Transfers',
        };
        const recipientTransaction: Transaction = {
            id: `${newTransactionId}-r`,
            userId: recipient.id,
            type: 'credit',
            amount,
            description: `Payment from ${sender.name}`,
            timestamp,
            partyName: sender.name,
            category: 'Transfers',
        };

        setTransactions(prev => [...prev, senderTransaction, recipientTransaction]);

        return { success: true, message: `Success! You sent $${amount.toFixed(2)} to ${recipient.name}.` };
    };
    
    const addCardToUser = (details: CardApplicationDetails): { success: boolean; message: string; newCard?: Card } => {
        if (!currentUser) return { success: false, message: 'Error: You are not logged in.' };

        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex === -1) return { success: false, message: 'Error: Current user not found.' };

        if (Math.random() < 0.2) { // 20% rejection rate
             return { success: false, message: `We're sorry, ${details.fullName}, but we were unable to approve your credit card application at this time.` };
        }

        const newCard = generateMockCard();
        const updatedUser = {
            ...users[userIndex],
            cards: [...users[userIndex].cards, newCard],
        };

        const newUsers = [...users];
        newUsers[userIndex] = updatedUser;
        setUsers(newUsers);
        setCurrentUser(updatedUser);

        return { success: true, message: `Congratulations, ${details.fullName}! Your new ${newCard.cardType} card has been approved.`, newCard };
    };

    const addLoanToUser = (details: LoanApplicationDetails): { success: boolean; message: string; newLoan?: Loan } => {
        if (!currentUser) return { success: false, message: 'Error: You are not logged in.' };

        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex === -1) return { success: false, message: 'Error: Current user not found.' };
        
        if (Math.random() < 0.3) { // 30% rejection rate
            return { success: false, message: `We're sorry, ${details.fullName}, but we were unable to approve your loan application for ${details.loanAmount} at this time.` };
        }

        const { loanAmount, loanTerm } = details;
        const interestRate = parseFloat((Math.random() * 10 + 3).toFixed(2)); // 3% to 13%
        const monthlyInterestRate = interestRate / 100 / 12;
        const monthlyPayment = (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTerm)) / (Math.pow(1 + monthlyInterestRate, loanTerm) - 1);
        
        const today = new Date();
        const paymentDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString(); // 1st of next month

        const newLoan: Loan = {
            id: `loan-${currentUser.id}-${Date.now()}`,
            userId: currentUser.id,
            loanAmount,
            interestRate,
            termMonths: loanTerm,
            monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
            remainingBalance: loanAmount,
            status: 'Active',
            startDate: new Date().toISOString(),
            paymentDueDate,
        };

        const updatedUser = {
            ...users[userIndex],
            balance: users[userIndex].balance + loanAmount,
            loans: [...users[userIndex].loans, newLoan],
        };

        const newUsers = [...users];
        newUsers[userIndex] = updatedUser;
        setUsers(newUsers);
        setCurrentUser(updatedUser);
        
        const loanCreditTransaction: Transaction = {
            id: `t-loan-${newLoan.id}`,
            userId: currentUser.id,
            type: 'credit',
            amount: loanAmount,
            description: `Loan Disbursement`,
            timestamp: new Date().toISOString(),
            partyName: "Nova Bank Loans",
            category: 'Income',
        };
        setTransactions(prev => [...prev, loanCreditTransaction]);

        return { success: true, message: `Congratulations! Your loan for $${loanAmount.toFixed(2)} has been approved. The funds are now available in your account.`, newLoan };
    };

    const requestPaymentExtension = (accountId: string, type: 'card' | 'loan'): { success: boolean; message: string; newDueDate?: string } => {
        if (!currentUser) return { success: false, message: 'Error: You are not logged in.' };
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex === -1) return { success: false, message: 'Error: Current user not found.' };
        
        if (Math.random() < 0.1) { // 10% rejection rate
             return { success: false, message: `We're sorry, but we were unable to process a payment extension for this account at this time.` };
        }
        
        let newDueDate: Date | null = null;
        let message = '';
        const updatedUser = { ...users[userIndex] };

        if (type === 'card') {
            const cardIndex = updatedUser.cards.findIndex(c => c.cardNumber.slice(-4) === accountId);
            if (cardIndex === -1) return { success: false, message: `Error: Card ending in ${accountId} not found.`};
            const originalDueDate = new Date(updatedUser.cards[cardIndex].paymentDueDate);
            newDueDate = new Date(originalDueDate.setDate(originalDueDate.getDate() + 14));
            updatedUser.cards[cardIndex].paymentDueDate = newDueDate.toISOString();
            message = `Success! Your payment due date for the card ending in ${accountId} has been extended to`;

        } else if (type === 'loan') {
            const loanIndex = updatedUser.loans.findIndex(l => l.id === accountId);
            if (loanIndex === -1) return { success: false, message: `Error: Loan with ID ${accountId} not found.`};
            const originalDueDate = new Date(updatedUser.loans[loanIndex].paymentDueDate);
            newDueDate = new Date(originalDueDate.setDate(originalDueDate.getDate() + 14));
            updatedUser.loans[loanIndex].paymentDueDate = newDueDate.toISOString();
            message = `Success! Your payment due date for loan ${accountId} has been extended to`;
        } else {
            return { success: false, message: `Invalid account type.` };
        }
        
        const newUsers = [...users];
        newUsers[userIndex] = updatedUser;
        setUsers(newUsers);
        setCurrentUser(updatedUser);
        
        const formattedDate = newDueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        return { success: true, message: `${message} ${formattedDate}.`, newDueDate: newDueDate.toISOString() };
    };

    const contextValue = { currentUser, users, transactions, login, logout, registerUser, transferMoney, addCardToUser, addLoanToUser, requestPaymentExtension };

    const screenKey = currentUser ? 'dashboard' : authScreen;
    
    const renderAuthScreen = () => {
        switch(authScreen) {
            case 'login':
                return <LoginScreen onLogin={login} onBack={() => setAuthScreen('welcome')} />;
            case 'register':
                return <RegisterScreen onRegister={registerUser} onBack={() => setAuthScreen('welcome')} />;
            case 'welcome':
            default:
                return <WelcomeScreen onNavigateToLogin={() => setAuthScreen('login')} onNavigateToRegister={() => setAuthScreen('register')} />;
        }
    }

    return (
        <BankContext.Provider value={contextValue}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={screenKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                    {currentUser ? <Dashboard /> : renderAuthScreen() }
                </motion.div>
            </AnimatePresence>
        </BankContext.Provider>
    );
}
