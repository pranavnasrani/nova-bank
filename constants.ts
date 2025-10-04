import { User, Transaction, Card, Loan } from './types';

const generateMockCardTransactions = (card: Omit<Card, 'transactions'>): Transaction[] => {
    const transactions: Transaction[] = [];
    let usedBalance = card.creditBalance;
    const today = new Date();

    const merchantsByCategory: Record<string, string[]> = {
        'Groceries': ['Whole Foods', 'SuperMart', 'Target'],
        'Transport': ['Uber', 'Shell Gas', 'Metro'],
        'Entertainment': ['Netflix', 'Spotify', 'Movieplex'],
        'Shopping': ['Amazon', 'Best Buy', 'Apple Store'],
        'Food': ['Starbucks', 'The Daily Grind', 'Pizza Palace'],
        'Bills': ['AT&T', 'Con Edison', 'Geico'],
    };
    
    const categories = Object.keys(merchantsByCategory);

    for (let i = 0; i < 25; i++) {
        if (usedBalance < 10) break;
        const amount = parseFloat((Math.random() * (Math.min(usedBalance * 0.2, 150)) + 5).toFixed(2));
        usedBalance -= amount;
        
        const transactionDate = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // within last 30 days
        const category = categories[Math.floor(Math.random() * categories.length)];
        const merchant = merchantsByCategory[category][Math.floor(Math.random() * merchantsByCategory[category].length)];

        transactions.push({
            id: `tx-card-${card.cardNumber.slice(-4)}-${i}`,
            userId: 0, // Belongs to the card, user ID is higher up
            type: 'debit', // Card transactions are debits from the credit line
            amount,
            description: merchant,
            timestamp: transactionDate.toISOString(),
            partyName: 'Merchant',
            category,
            cardId: card.cardNumber,
        });
    }
    return transactions.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateMockCard = (): Card => {
  // FIX: Explicitly typed `cardType` to prevent type widening to `string`.
  const cardType: 'Visa' | 'Mastercard' = Math.random() > 0.5 ? 'Visa' : 'Mastercard';
  const cardNumber =
    cardType === 'Visa'
      ? '4' + Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('')
      : '5' + Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
  
  const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const expiryYear = String(new Date().getFullYear() + Math.floor(Math.random() * 5) + 2).slice(-2);
  
  const creditLimit = [5000, 10000, 15000, 20000][Math.floor(Math.random() * 4)];
  const creditBalance = parseFloat((Math.random() * creditLimit * 0.8).toFixed(2));
  
  const today = new Date();
  const paymentDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 15).toISOString(); // 15th of next month
  const statementBalance = parseFloat((creditBalance * (0.9 + Math.random() * 0.1)).toFixed(2)); // 90-100% of current balance

  const partialCard = {
    cardNumber,
    expiryDate: `${expiryMonth}/${expiryYear}`,
    cvv: String(Math.floor(Math.random() * 900) + 100),
    cardType,
    creditLimit,
    creditBalance,
    apr: parseFloat((Math.random() * 15 + 15).toFixed(2)), // e.g., 15% to 30%
    paymentDueDate,
    statementBalance,
    minimumPayment: parseFloat(Math.max(25, statementBalance * 0.02).toFixed(2)), // 2% or $25
  };
  
  return {
    ...partialCard,
    transactions: generateMockCardTransactions(partialCard),
  };
};

const generateMockLoan = (userId: number): Loan => {
    const loanAmount = [5000, 10000, 20000, 50000][Math.floor(Math.random() * 4)];
    const interestRate = parseFloat((Math.random() * 10 + 3).toFixed(2)); // 3% to 13%
    const termMonths = [24, 36, 48, 60][Math.floor(Math.random() * 4)];
    
    const monthlyInterestRate = interestRate / 100 / 12;
    const monthlyPayment = (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, termMonths)) / (Math.pow(1 + monthlyInterestRate, termMonths) - 1);
    
    const today = new Date();
    const paymentDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString(); // 1st of next month

    return {
        id: `loan-${userId}-${Date.now()}${Math.random()}`,
        userId,
        loanAmount,
        interestRate,
        termMonths,
        monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
        remainingBalance: parseFloat((loanAmount * (0.5 + Math.random() * 0.4)).toFixed(2)), // Remaining balance between 50% and 90%
        status: 'Active',
        startDate: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 365)).toISOString(),
        paymentDueDate
    };
};

const generateAccountNumber = (): string => {
    return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
}


export const MOCK_USERS: User[] = [
  { id: 1, name: 'Alice Johnson', username: 'alice', pin: '1234', balance: 5430.50, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1011/100', cards: [generateMockCard()], loans: [generateMockLoan(1)] },
  { id: 2, name: 'Bob Williams', username: 'bob', pin: '5678', balance: 1250.75, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1012/100', cards: [generateMockCard()], loans: [] },
  { id: 3, name: 'Charlie Brown', username: 'charlie', pin: '1111', balance: 8765.20, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1013/100', cards: [generateMockCard(), generateMockCard()], loans: [generateMockLoan(3)] },
  { id: 4, name: 'Diana Prince', username: 'diana', pin: '2222', balance: 15200.00, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1014/100', cards: [generateMockCard()], loans: [] },
  { id: 5, name: 'Ethan Hunt', username: 'ethan', pin: '3333', balance: 345.80, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1015/100', cards: [generateMockCard()], loans: [] },
  { id: 6, name: 'Fiona Glenanne', username: 'fiona', pin: '4444', balance: 9980.00, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1016/100', cards: [generateMockCard()], loans: [generateMockLoan(6)] },
  { id: 7, name: 'George Costanza', username: 'george', pin: '5555', balance: 12.30, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1018/100', cards: [generateMockCard()], loans: [] },
  { id: 8, name: 'Hannah Montana', username: 'hannah', pin: '6666', balance: 75000.00, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1025/100', cards: [generateMockCard()], loans: [] },
  { id: 9, name: 'Ian Malcolm', username: 'ian', pin: '7777', balance: 4242.42, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1027/100', cards: [generateMockCard()], loans: [] },
  { id: 10, name: 'Leila Organa', username: 'leila', pin: '1010', balance: 123456.78, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1028/100', cards: [generateMockCard()], loans: [generateMockLoan(10)] },
  { id: 11, name: 'Kyle Reese', username: 'kyle', pin: '1122', balance: 850.00, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/103/100', cards: [generateMockCard()], loans: [] },
  { id: 12, name: 'Jack Sparrow', username: 'jack', pin: '1313', balance: 13000.00, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1040/100', cards: [generateMockCard()], loans: [] },
  { id: 13, name: 'Michael Scott', username: 'michael', pin: '2424', balance: 430.10, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1041/100', cards: [generateMockCard()], loans: [] },
  { id: 14, name: 'Neo Anderson', username: 'neo', pin: '0101', balance: 9999.99, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1043/100', cards: [generateMockCard()], loans: [generateMockLoan(14)] },
  { id: 15, name: 'Olivia Pope', username: 'olivia', pin: '7521', balance: 250000.00, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1044/100', cards: [generateMockCard()], loans: [] },
  { id: 16, name: 'Peter Parker', username: 'peter', pin: '8888', balance: 50.25, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1054/100', cards: [generateMockCard()], loans: [] },
  { id: 17, name: 'Quentin Coldwater', username: 'quentin', pin: '9999', balance: 3210.00, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1062/100', cards: [generateMockCard()], loans: [] },
  { id: 18, name: 'Rachel Green', username: 'rachel', pin: '1212', balance: 6700.00, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1064/100', cards: [generateMockCard()], loans: [] },
  { id: 19, name: 'Steve Rogers', username: 'steve', pin: '1945', balance: 10500.00, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1066/100', cards: [generateMockCard()], loans: [] },
  { id: 20, name: 'Tony Stark', username: 'tony', pin: '2008', balance: 1000000.00, savingsAccountNumber: generateAccountNumber(), avatarUrl: 'https://picsum.photos/id/1074/100', cards: [generateMockCard()], loans: [generateMockLoan(20)] },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', userId: 1, type: 'debit', amount: 75.50, description: 'Grocery Shopping', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), partyName: 'SuperMart', category: 'Groceries' },
  { id: 't2', userId: 1, type: 'credit', amount: 1200.00, description: 'Paycheck Deposit', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), partyName: 'ACME Corp', category: 'Income' },
  { id: 't3', userId: 1, type: 'debit', amount: 12.00, description: 'Coffee', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), partyName: 'The Daily Grind', category: 'Food' },
  { id: 't4', userId: 2, type: 'credit', amount: 500.00, description: 'Birthday Gift', timestamp: new Date(Date.now() - 86400000 * 10).toISOString(), partyName: 'Alice Johnson', category: 'Gifts' },
];

// Exporting the helper for use in the App registration logic
export { generateMockCard, generateMockLoan, generateAccountNumber };