'use client';

import { useSession } from '@/lib/hooks/useSession';

const Header = () => {
    const { session, isAuthenticated, logout } = useSession();

    const handleLogout = () => {
        logout('/');
    };

    if (!isAuthenticated) {
        return (
            <header>
                <nav>
                    <a href="/signin">تسجيل الدخول</a>
                </nav>
            </header>
        );
    }

    return (
        <header>
            <nav>
                <span>مرحباً {session?.user?.firstName}</span>
                <button onClick={handleLogout}>
                    تسجيل الخروج
                </button>
            </nav>
        </header>
    );
};

export default Header;