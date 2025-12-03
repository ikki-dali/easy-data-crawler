# 1-2: Docker Compose 作成

## 基本情報

| 項目 | 内容 |
|------|------|
| **ID** | 1-2 |
| **複雑度** | Simple |
| **見積もり** | 1時間 |
| **依存** | なし |
| **ステータス** | ⬜ 未着手 |

## 説明

開発環境用の Docker Compose を作成し、PostgreSQL と Redis を起動できるようにする。

## タスク

- [ ] `docker-compose.yml` 作成
- [ ] PostgreSQL 15 設定
- [ ] Redis 7 設定
- [ ] ボリューム設定（データ永続化）
- [ ] `.dockerignore` 作成
- [ ] 起動確認

## 実装詳細

### docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: datacrawler-db
    environment:
      POSTGRES_DB: datacrawler
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: datacrawler-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### 起動コマンド

```bash
# 起動
docker-compose up -d

# ログ確認
docker-compose logs -f

# 停止
docker-compose down

# データ含めて削除
docker-compose down -v
```

## 完了条件

- [ ] `docker-compose up -d` で起動する
- [ ] PostgreSQL に接続できる（localhost:5432）
- [ ] Redis に接続できる（localhost:6379）
- [ ] コンテナ再起動後もデータが永続化される

## 参考リソース

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)

