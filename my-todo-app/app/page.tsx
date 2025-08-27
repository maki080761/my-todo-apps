"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface Comment {
  id: number;
  text: string;
  authorName: string;
  authorId: string;
  createdAt: string;
}

interface Task {
  id: number;
  text: string;
  completed: boolean;
  userId: string;
  comments: Comment[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

const DEFAULT_USERS: User[] = [
  { id: "1", name: "田中太郎", email: "tanaka@example.com" },
  { id: "2", name: "佐藤花子", email: "sato@example.com" },
  { id: "3", name: "山田次郎", email: "yamada@example.com" }
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [taskIdCounter, setTaskIdCounter] = useState(1);
  const [commentIdCounter, setCommentIdCounter] = useState(1);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
  // User management state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  
  // Comment input states for each task
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedUsers = localStorage.getItem('users');
    const savedTasks = localStorage.getItem('tasks');
    
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (inputValue.trim() !== "" && currentUser) {
      const newTask: Task = {
        id: taskIdCounter,
        text: inputValue.trim(),
        completed: false,
        userId: currentUser.id,
        comments: [],
      };
      setTasks([...tasks, newTask]);
      setInputValue("");
      setTaskIdCounter(taskIdCounter + 1);
    }
  };

  const addComment = (taskId: number) => {
    if (!currentUser || !commentInputs[taskId]?.trim()) return;
    
    const newComment: Comment = {
      id: commentIdCounter,
      text: commentInputs[taskId].trim(),
      authorName: currentUser.name,
      authorId: currentUser.id,
      createdAt: new Date().toLocaleString(),
    };

    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, comments: [...task.comments, newComment] }
        : task
    ));

    setCommentInputs({ ...commentInputs, [taskId]: "" });
    setCommentIdCounter(commentIdCounter + 1);
  };

  const updateCommentInput = (taskId: number, value: string) => {
    setCommentInputs({ ...commentInputs, [taskId]: value });
  };

  const login = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setSelectedUserId("");
    }
  };

  const register = () => {
    if (registerName.trim() && registerEmail.trim()) {
      const newUser: User = {
        id: (users.length + 1).toString(),
        name: registerName.trim(),
        email: registerEmail.trim(),
      };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      setCurrentUser(newUser);
      setRegisterName("");
      setRegisterEmail("");
      setShowRegisterForm(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTask();
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetCompleted: boolean) => {
    e.preventDefault();
    if (draggedTask && draggedTask.completed !== targetCompleted) {
      setTasks(tasks.map(task =>
        task.id === draggedTask.id ? { ...task, completed: targetCompleted } : task
      ));
    }
    setDraggedTask(null);
  };

  // Filter tasks by current user
  const userTasks = currentUser ? tasks.filter(task => task.userId === currentUser.id) : [];
  const pendingTasks = userTasks.filter(task => !task.completed);
  const completedTasks = userTasks.filter(task => task.completed);

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, task)}
      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-move group"
    >
      {/* Task header */}
      <div className="flex items-start gap-3 mb-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => toggleTask(task.id)}
          className="mt-0.5"
        />
        <span
          className={`flex-1 ${
            task.completed 
              ? "line-through text-gray-500" 
              : "text-gray-800"
          }`}
        >
          {task.text}
        </span>
        <button
          onClick={() => deleteTask(task.id)}
          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-all duration-200"
          title="タスクを削除"
        >
          ×
        </button>
      </div>

      {/* Comments section */}
      <div className="border-t pt-3 space-y-2">
        <h4 className="text-sm font-medium text-gray-600 mb-2">コメント</h4>
        
        {/* Comments list */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {task.comments.length === 0 ? (
            <p className="text-xs text-gray-400 italic">コメントはありません</p>
          ) : (
            task.comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-2 rounded text-xs">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-700">{comment.authorName}</span>
                  <span className="text-gray-400 text-xs">{comment.createdAt}</span>
                </div>
                <p className="text-gray-800">{comment.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Comment input */}
        <div className="flex gap-2 mt-2">
          <Input
            type="text"
            placeholder="コメントを追加..."
            value={commentInputs[task.id] || ""}
            onChange={(e) => updateCommentInput(task.id, e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addComment(task.id)}
            className="flex-1 h-8 text-xs"
          />
          <Button
            onClick={() => addComment(task.id)}
            disabled={!commentInputs[task.id]?.trim()}
            size="sm"
            className="h-8 px-3 text-xs bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300"
          >
            追加
          </Button>
        </div>
      </div>
    </div>
  );

  // Show login screen if no current user
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 flex items-center justify-center py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              Todo管理システム
            </h1>
            
            {!showRegisterForm ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ユーザーを選択
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">ユーザーを選択してください</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <Button
                  onClick={() => login(selectedUserId)}
                  disabled={!selectedUserId}
                  className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300"
                >
                  ログイン
                </Button>
                
                <div className="text-center">
                  <button
                    onClick={() => setShowRegisterForm(true)}
                    className="text-pink-600 hover:text-pink-800 underline"
                  >
                    新規登録はこちら
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 text-center">
                  新規登録
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名前
                  </label>
                  <Input
                    type="text"
                    placeholder="田中太郎"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <Input
                    type="email"
                    placeholder="tanaka@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Button
                  onClick={register}
                  disabled={!registerName.trim() || !registerEmail.trim()}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300"
                >
                  登録
                </Button>
                
                <div className="text-center">
                  <button
                    onClick={() => setShowRegisterForm(false)}
                    className="text-gray-600 hover:text-gray-800 underline"
                  >
                    ログインに戻る
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* User header */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            ようこそ、{currentUser.name}さん
          </h1>
          <Button
            onClick={logout}
            variant="outline"
            className="text-pink-600 border-pink-600 hover:bg-pink-50"
          >
            ログアウト
          </Button>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Todo管理 - カンバンボード
        </h2>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex gap-3 max-w-md mx-auto">
            <Input
              type="text"
              placeholder="新しいタスクを入力..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={addTask} className="bg-pink-600 hover:bg-pink-700">
              追加
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 未完了カラム */}
          <div
            className="bg-white rounded-lg shadow-lg p-6 min-h-[400px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, false)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                未完了
              </h2>
              <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-sm font-medium">
                {pendingTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingTasks.length === 0 ? (
                <p className="text-gray-400 text-center py-8 italic">
                  未完了のタスクはありません
                </p>
              ) : (
                pendingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </div>

          {/* 完了済みカラム */}
          <div
            className="bg-white rounded-lg shadow-lg p-6 min-h-[400px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, true)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
                完了済み
              </h2>
              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-sm font-medium">
                {completedTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {completedTasks.length === 0 ? (
                <p className="text-gray-400 text-center py-8 italic">
                  完了したタスクはありません
                </p>
              ) : (
                completedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
