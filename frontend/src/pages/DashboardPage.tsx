import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                SubsManager
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                こんにちは、{user?.name || user?.email}さん
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-outline text-sm"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ダッシュボード
              </h2>
              <p className="text-gray-600 mb-8">
                SubsManagerへようこそ！<br />
                サブスクリプション管理機能は今後実装予定です。
              </p>
              
              {/* User Info Card */}
              <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  ユーザー情報
                </h3>
                <div className="space-y-2 text-left">
                  <div>
                    <span className="text-sm font-medium text-gray-500">名前:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {user?.name || '未設定'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">メール:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {user?.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">登録日:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ja-JP') : '不明'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}