<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/github_username/repo_name">
    <img src="public/logo.jpeg" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Image Generation Studio</h3>

  <p align="center">
    A full-stack web application for training and deploying custom Stable Diffusion models. This platform enables users to upload datasets, train personalized AI image generation models, and generate images through a RESTful API.
    <br />
    <a href="https://github.com/github_username/repo_name"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/github_username/repo_name">View Demo</a>
    &middot;
    <a href="https://github.com/github_username/repo_name/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/github_username/repo_name/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#features">Features</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#environment-variables">Environment Variables</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#api-documentation">API Documentation</a></li>
      </ul>
    </li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#testing">Testing</a></li>
    <li><a href="#deployment">Deployment</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

Image Generation Studio is an MVP platform that simplifies the process of creating custom AI image generation models. Users can:

- **Upload Training Datasets**: Upload ZIP files containing training images
- **Train Custom Models**: Configure and train Stable Diffusion models with custom datasets
- **Monitor Training**: Track training progress in real-time
- **Generate Images**: Use trained models via RESTful API or web interface
- **Manage API Keys**: Create and manage API keys for programmatic access
- **Billing & Payments**: Integrated Stripe payment system for usage-based billing

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Features

#### Core Functionality
- 🔐 **Authentication**: Email/password and Google OAuth authentication via NextAuth.js
- 📦 **Dataset Management**: Upload, validate, and manage training datasets
- 🤖 **Model Training**: Train custom Stable Diffusion models using RunPod infrastructure
- 🎨 **Image Generation**: Generate images using trained models via API or UI
- 🔑 **API Key Management**: Create, view, and manage API keys for programmatic access
- 💳 **Billing System**: Stripe integration for payments and usage tracking
- 📊 **Real-time Monitoring**: Track training progress and model status

#### Technical Features
- 🏗️ **Domain-Driven Architecture**: Clean separation of concerns with service layers
- 🗄️ **Type-Safe Database**: Drizzle ORM with PostgreSQL for type-safe queries
- ☁️ **Cloud Storage**: Cloudflare R2 for storing datasets and model weights
- 🔄 **Webhook Integration**: Automated deployment via GitHub Actions
- 🧪 **Testing**: Jest test suite with in-memory database for fast testing
- 📝 **Database Migrations**: Version-controlled schema migrations

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![TypeScript][TypeScript]][TypeScript-url]
* [![PostgreSQL][PostgreSQL]][PostgreSQL-url]
* [![TailwindCSS][TailwindCSS]][TailwindCSS-url]
* [![Stripe][Stripe]][Stripe-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

This section will guide you through setting up Image Generation Studio locally. To get a local copy up and running, follow these steps.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.x
- **npm** or **yarn**
- **PostgreSQL** database (or Supabase account)
- Accounts for:
  - Supabase (database)
  - Cloudflare R2 (storage)
  - RunPod (training infrastructure)
  - Stripe (payments, optional)
  - Sentry (error tracking, optional)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/github_username/repo_name.git
   cd img-gen-studio
   ```

2. Install NPM packages
   ```sh
   npm install
   ```

3. Set up environment variables
   
   Create a `.env.local` file in the root directory by copying the template:
   ```sh
   cp dotEnv.txt .env.local
   ```
   
   Then fill in all the required environment variables (see [Environment Variables](#environment-variables) section below).

4. Set up the Database
   
   - Create a new project on [Supabase](https://supabase.com)
   - Copy your database connection string to `.env.local` as `DATABASE_URL`
   - Copy your Supabase project URL and service role key

5. Run database migrations
   ```sh
   npm run migrate
   ```

6. Start the development server
   ```sh
   npm run dev
   ```

7. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Environment Variables

See `dotEnv.txt` for a complete template. Here's a quick reference:

#### Required Variables

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `DATABASE_URL` | PostgreSQL connection string | Supabase project settings |
| `AUTH_SECRET` | NextAuth secret | Run `npx auth secret` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase project settings |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Supabase project settings > API |
| `R2_ENDPOINT` | Cloudflare R2 endpoint | Cloudflare R2 dashboard |
| `R2_ACCESS_KEY_ID` | R2 access key ID | Cloudflare R2 API tokens |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key | Cloudflare R2 API tokens |
| `R2_BUCKET` | R2 bucket name | Cloudflare R2 dashboard |
| `RUNPOD_API_KEY` | RunPod API key | RunPod dashboard > Settings > API Keys |
| `RUNPOD_TRAINING_ENDPOINT` | RunPod endpoint URL | RunPod dashboard |
| `CUSTOM_WEBHOOK_TOKEN` | Webhook auth token | Generate a secure random token |
| `NEXT_PUBLIC_APP_URL` | Application URL | Your deployment URL |

#### Optional Variables

- **OAuth**: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- **Payments**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Monitoring**: `NEXT_PUBLIC_SENTRY_DSN`
- **Deployment**: `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_WORKFLOW`
- **Storage**: `R2_URL_EXPIRATION` (default: 3600 seconds)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage

### Available Scripts

#### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

#### Database
```bash
npm run generate <name>    # Generate a new migration
npm run migrate            # Apply pending migrations
```

#### Testing
```bash
npm run test              # Run Jest tests
npm run test -- --watch   # Run tests in watch mode
npm run test -- --coverage # Run tests with coverage
```

### Database & Migrations

This project uses Drizzle ORM for type-safe database operations with PostgreSQL.

#### Migration Workflow

1. **Generate a migration** after schema changes:
   ```bash
   npm run generate add_new_feature
   ```

2. **Review the generated migration** in `drizzle/` directory

3. **Apply migrations** to your database:
   ```bash
   npm run migrate
   ```

### API Documentation

#### Authentication

All API requests require authentication via API key in the `Authorization` header:

```
Authorization: Bearer ak_<your-api-key>
```

#### Generate Images

**Endpoint:** `POST /api/v1/models/{modelId}/generate`

**Request Body:**
```json
{
  "prompt": "a beautiful sunset over mountains",
  "negative_prompt": "blurry, low quality",
  "num_images": 1,
  "guidance_scale": 7.5,
  "num_inference_steps": 50,
  "seed": 42
}
```

**Response:**
```json
{
  "images": ["base64-encoded-image-1", "base64-encoded-image-2"],
  "seed": 42
}
```

#### Error Responses

All errors follow this format:
```json
{
  "error": "Error message description"
}
```

Common status codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid or missing API key)
- `404` - Not Found (model doesn't exist)
- `500` - Internal Server Error

_For more examples, please refer to the [Documentation](https://github.com/github_username/repo_name)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Project Structure

```
img-gen-studio/
├── app/                          # Next.js App Router
│   ├── (ui)/                     # Protected UI routes
│   │   ├── api-keys/             # API key management
│   │   ├── billing/              # Billing and payments
│   │   ├── models/               # Model management
│   │   │   ├── [id]/             # Individual model pages
│   │   │   └── train/            # Model training interface
│   │   └── components/           # UI-specific components
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── models/               # Model-related APIs
│   │   ├── storage/              # Storage presigned URLs
│   │   ├── stripe/               # Stripe webhooks
│   │   └── v1/                   # Versioned API endpoints
│   ├── actions/                  # Server actions
│   │   ├── api-key-actions.ts    # API key operations
│   │   ├── dataset-actions.ts    # Dataset operations
│   │   ├── model-actions.ts      # Model operations
│   │   └── registration-actions.ts
│   ├── login/                    # Login page
│   └── register/                 # Registration page
├── components/                   # Reusable React components
│   ├── ui/                       # Shadcn/ui components
│   ├── api-keys-table.tsx        # API keys table component
│   ├── billing/                  # Billing components
│   └── model-selection.tsx       # Model selection UI
├── lib/                          # Core library code
│   ├── api-key/                  # API key domain
│   │   ├── auth.ts               # API authentication
│   │   ├── schema.ts             # Database schema
│   │   └── service.ts            # Business logic
│   ├── dataset/                  # Dataset domain
│   ├── model/                    # Model domain
│   ├── payment/                  # Payment domain
│   ├── runpod/                   # RunPod integration
│   ├── user/                     # User domain
│   ├── auth.ts                   # NextAuth configuration
│   ├── db.ts                     # Database connection
│   ├── storage.ts                # Cloudflare R2 client
│   └── stripe.ts                 # Stripe client
├── drizzle/                      # Database migrations
│   ├── *.sql                     # Migration SQL files
│   └── meta/                     # Migration metadata
├── tests/                        # Test files
│   ├── dataset/                  # Dataset tests
│   ├── model/                    # Model tests
│   └── setup/                    # Test configuration
├── public/                       # Static assets
└── dotEnv.txt                    # Environment variables template
```

### Architecture

#### Domain-Driven Design

The application follows a domain-driven architecture with clear separation of concerns:

- **Schemas** (`lib/{domain}/schema.ts`): Database table definitions using Drizzle ORM
- **Services** (`lib/{domain}/service.ts`): Business logic and data access
- **Actions** (`app/actions/{domain}-actions.ts`): Server actions for Next.js
- **API Routes** (`app/api/`): RESTful API endpoints

#### Key Domains

- **Users**: Authentication, user profiles, balance management
- **Datasets**: Dataset upload, validation, storage
- **Models**: Model training, status tracking, deployment
- **API Keys**: Key generation, authentication, management
- **Payments**: Stripe integration, billing, webhooks

#### Data Flow

1. **User Upload**: User uploads dataset → Stored in R2 → Database record created
2. **Model Training**: User starts training → RunPod API called → Training status tracked
3. **Image Generation**: API request authenticated → Model loaded → Images generated
4. **Webhooks**: Training completes → Webhook received → Model deployed → GitHub Action triggered

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Testing

The project uses Jest for unit testing with a focus on business logic and database operations.

#### Test Structure

- Tests are organized in the `tests/` directory
- Each domain entity has its own test file (e.g., `tests/model/service.test.ts`)
- Tests use an in-memory PGLite database for fast, isolated testing
- Test setup is configured in `tests/setup/`

#### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Deployment

#### Prerequisites

- Vercel account (recommended) or other Next.js hosting
- All environment variables configured
- Database migrations applied

#### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

#### Environment Variables in Production

Ensure all required environment variables are set in your hosting platform's environment variable settings.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

- [x] User authentication (Email/Password & Google OAuth)
- [x] Dataset upload and management
- [x] Model training integration with RunPod
- [x] Image generation API
- [x] API key management
- [x] Stripe payment integration
- [x] Real-time training progress tracking
- [ ] Advanced model configuration options
- [ ] Model versioning and rollback
- [ ] Batch image generation
- [ ] User dashboard analytics
- [ ] Model sharing and marketplace

See the [open issues](https://github.com/github_username/repo_name/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Write tests for new features
- Follow the existing project structure

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Andreas Palaikythritis - andreas.pale12@gmail.com

Project Link: [https://github.com/github_username/repo_name](https://github.com/github_username/repo_name)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Next.js](https://nextjs.org/) - The React framework
* [Drizzle ORM](https://orm.drizzle.team/) - Type-safe ORM
* [Shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
* [RunPod](https://www.runpod.io/) - GPU infrastructure
* [Stable Diffusion](https://stability.ai/) - AI model architecture

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/github_username/repo_name.svg?style=for-the-badge
[contributors-url]: https://github.com/github_username/repo_name/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/github_username/repo_name.svg?style=for-the-badge
[forks-url]: https://github.com/github_username/repo_name/network/members
[stars-shield]: https://img.shields.io/github/stars/github_username/repo_name.svg?style=for-the-badge
[stars-url]: https://github.com/github_username/repo_name/stargazers
[issues-shield]: https://img.shields.io/github/issues/github_username/repo_name.svg?style=for-the-badge
[issues-url]: https://github.com/github_username/repo_name/issues
[license-shield]: https://img.shields.io/github/license/github_username/repo_name.svg?style=for-the-badge
[license-url]: https://github.com/github_username/repo_name/blob/master/LICENSE
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/andreas-palaikythritis/
[product-screenshot]: images/screenshot.png
<!-- Shields.io badges. You can a comprehensive list with many more badges at: https://github.com/inttter/md-badges -->
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[TypeScript]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[PostgreSQL]: https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[TailwindCSS]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[TailwindCSS-url]: https://tailwindcss.com/
[Stripe]: https://img.shields.io/badge/Stripe-626CD9?style=for-the-badge&logo=Stripe&logoColor=white
[Stripe-url]: https://stripe.com/
