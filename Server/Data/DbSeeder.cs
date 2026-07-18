using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using CineCrick.Models;

namespace CineCrick.Data;

public static class DbSeeder
{
    public static void Seed(CineCrickContext context)
    {
        var databaseCreator = context.Database.GetService<Microsoft.EntityFrameworkCore.Storage.IDatabaseCreator>() as Microsoft.EntityFrameworkCore.Storage.RelationalDatabaseCreator;
        if (databaseCreator != null)
        {
            if (!databaseCreator.Exists()) databaseCreator.Create();
            if (!databaseCreator.HasTables()) databaseCreator.CreateTables();
        }
        else
        {
            context.Database.EnsureCreated();
        }

        // Dynamically add missing columns and tables if they do not exist
        try
        {
            var conn = context.Database.GetDbConnection();
            var wasClosed = conn.State == System.Data.ConnectionState.Closed;
            if (wasClosed) conn.Open();

            using var cmd = conn.CreateCommand();

            // Check IsBanned
            cmd.CommandText = "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Users' AND column_name='IsBanned');";
            var hasIsBanned = (bool)(cmd.ExecuteScalar() ?? false);
            if (!hasIsBanned)
            {
                using var alterCmd = conn.CreateCommand();
                alterCmd.CommandText = "ALTER TABLE \"Users\" ADD COLUMN \"IsBanned\" boolean NOT NULL DEFAULT false;";
                alterCmd.ExecuteNonQuery();
                Console.WriteLine("Successfully added 'IsBanned' column to 'Users' table.");
            }

            // Check AgeVerified
            cmd.CommandText = "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Users' AND column_name='AgeVerified');";
            var hasAgeVerified = (bool)(cmd.ExecuteScalar() ?? false);
            if (!hasAgeVerified)
            {
                using var alterCmd = conn.CreateCommand();
                alterCmd.CommandText = "ALTER TABLE \"Users\" ADD COLUMN \"AgeVerified\" boolean NOT NULL DEFAULT false;";
                alterCmd.ExecuteNonQuery();
                Console.WriteLine("Successfully added 'AgeVerified' column to 'Users' table.");
            }

            // Auto-create chat tables if missing
            string[] chatTableDDLs = new[]
            {
                @"CREATE TABLE IF NOT EXISTS ""InterestTags"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""Name"" text NOT NULL UNIQUE
                );",
                @"CREATE TABLE IF NOT EXISTS ""Topics"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""CreatorUserId"" integer NOT NULL REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
                    ""Title"" text NOT NULL,
                    ""Category"" text NOT NULL DEFAULT 'General',
                    ""Status"" text NOT NULL DEFAULT 'open',
                    ""MaxParticipants"" integer NOT NULL DEFAULT 2,
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""ExpiresAt"" timestamp with time zone NOT NULL DEFAULT (NOW() + interval '24 hours')
                );",
                @"CREATE TABLE IF NOT EXISTS ""TopicTags"" (
                    ""TopicId"" integer NOT NULL REFERENCES ""Topics""(""Id"") ON DELETE CASCADE,
                    ""TagId"" integer NOT NULL REFERENCES ""InterestTags""(""Id"") ON DELETE CASCADE,
                    PRIMARY KEY (""TopicId"", ""TagId"")
                );",
                @"CREATE TABLE IF NOT EXISTS ""Conversations"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""TopicId"" integer NOT NULL REFERENCES ""Topics""(""Id"") ON DELETE CASCADE,
                    ""Status"" text NOT NULL DEFAULT 'active',
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
                );",
                @"CREATE TABLE IF NOT EXISTS ""ConversationParticipants"" (
                    ""ConversationId"" integer NOT NULL REFERENCES ""Conversations""(""Id"") ON DELETE CASCADE,
                    ""UserId"" integer NOT NULL REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
                    ""Alias"" text NOT NULL,
                    ""IdentityRevealed"" boolean NOT NULL DEFAULT false,
                    ""JoinedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""LeftAt"" timestamp with time zone,
                    PRIMARY KEY (""ConversationId"", ""UserId"")
                );",
                @"CREATE TABLE IF NOT EXISTS ""Messages"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""ConversationId"" integer NOT NULL REFERENCES ""Conversations""(""Id"") ON DELETE CASCADE,
                    ""SenderUserId"" integer NOT NULL REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
                    ""Body"" text NOT NULL,
                    ""SentAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""IsFlagged"" boolean NOT NULL DEFAULT false
                );",
                @"CREATE TABLE IF NOT EXISTS ""Reports"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""ReporterUserId"" integer NOT NULL REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
                    ""ReportedUserId"" integer NOT NULL REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
                    ""ConversationId"" integer REFERENCES ""Conversations""(""Id"") ON DELETE SET NULL,
                    ""Reason"" text NOT NULL,
                    ""Status"" text NOT NULL DEFAULT 'pending',
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""ResolvedAt"" timestamp with time zone
                );",
                @"CREATE TABLE IF NOT EXISTS ""Blocks"" (
                    ""BlockerUserId"" integer NOT NULL REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
                    ""BlockedUserId"" integer NOT NULL REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    PRIMARY KEY (""BlockerUserId"", ""BlockedUserId"")
                );"
            };

            foreach (var ddl in chatTableDDLs)
            {
                using var ddlCmd = conn.CreateCommand();
                ddlCmd.CommandText = ddl;
                ddlCmd.ExecuteNonQuery();
            }
            Console.WriteLine("Chat tables verified/created successfully.");

            if (wasClosed) conn.Close();
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error checking/updating database schema: " + ex.Message);
        }

        // Check if already seeded
        if (context.Cricketers.Any())
        {
            return;
        }

        // 1. Seed Cricketers
        var cricketers = new List<Cricketer>
        {
            new Cricketer
            {
                Name = "Sachin Tendulkar",
                Slug = "sachin-tendulkar",
                PhotoUrl = "https://images.unsplash.com/photo-1540747737956-37872404a8e3?w=500&auto=format&fit=crop&q=60", // Generic cricket photo
                StatsJson = JsonSerializer.Serialize(new Dictionary<string, string>
                {
                    { "Matches", "664" },
                    { "Runs", "34,357" },
                    { "100s", "100" },
                    { "50s", "164" },
                    { "Wickets", "201" }
                }),
                Bio = "Widely regarded as one of the greatest batsmen in the history of cricket. He is the all-time highest run-scorer in international cricket and the only player to score one hundred international centuries.",
                IplTeam = "Mumbai Indians"
            },
            new Cricketer
            {
                Name = "Mahendra Singh Dhoni",
                Slug = "ms-dhoni",
                PhotoUrl = "https://images.unsplash.com/photo-1531415080290-bc9b85db80f5?w=500&auto=format&fit=crop&q=60",
                StatsJson = JsonSerializer.Serialize(new Dictionary<string, string>
                {
                    { "Matches", "538" },
                    { "Runs", "17,266" },
                    { "Average", "44.96" },
                    { "Stumpings", "195" },
                    { "IPL Titles", "5" }
                }),
                Bio = "Affectionately known as 'Captain Cool', MS Dhoni led India to victory in the 2007 ICC World Twenty20, the 2011 ICC Cricket World Cup, and the 2013 ICC Champions Trophy. He is the iconic captain of Chennai Super Kings.",
                IplTeam = "Chennai Super Kings"
            },
            new Cricketer
            {
                Name = "Virat Kohli",
                Slug = "virat-kohli",
                PhotoUrl = "https://images.unsplash.com/photo-1607734834839-de33a7d187c2?w=500&auto=format&fit=crop&q=60",
                StatsJson = JsonSerializer.Serialize(new Dictionary<string, string>
                {
                    { "Matches", "522" },
                    { "Runs", "26,900" },
                    { "100s", "80" },
                    { "Average", "53.55" }
                }),
                Bio = "Former captain of the Indian national cricket team and Royal Challengers Bengaluru. Known for his intense competitiveness, chase mastery, and outstanding athletic fitness.",
                IplTeam = "Royal Challengers Bengaluru"
            },
            new Cricketer
            {
                Name = "Kapil Dev",
                Slug = "kapil-dev",
                PhotoUrl = "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=500&auto=format&fit=crop&q=60",
                StatsJson = JsonSerializer.Serialize(new Dictionary<string, string>
                {
                    { "Matches", "356" },
                    { "Runs", "9,031" },
                    { "Wickets", "687" },
                    { "Highest Score", "175*" }
                }),
                Bio = "The legendary fast bowling all-rounder who captained the Indian cricket team to its historic first World Cup triumph in 1983 at Lord's.",
                IplTeam = "None"
            },
            new Cricketer
            {
                Name = "Harbhajan Singh",
                Slug = "harbhajan-singh",
                PhotoUrl = "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&auto=format&fit=crop&q=60",
                StatsJson = JsonSerializer.Serialize(new Dictionary<string, string>
                {
                    { "Matches", "367" },
                    { "Wickets", "711" },
                    { "5-Wicket Hauls", "28" }
                }),
                Bio = "Nicknamed 'The Turbanator', Harbhajan is one of India's most successful off-spinners. He has transitioned into film acting, playing major roles in Tamil and Hindi cinema.",
                IplTeam = "Chennai Super Kings (Former)"
            }
        };

        context.Cricketers.AddRange(cricketers);
        context.SaveChanges(); // Save cricketers first to get IDs

        // 2. Seed Actors/Owners
        var actors = new List<Actor>
        {
            new Actor
            {
                Name = "Shah Rukh Khan",
                Slug = "shah-rukh-khan",
                PhotoUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60",
                IplTeam = "Kolkata Knight Riders",
                Bio = "Often referred to as the 'Baadshah of Bollywood' or 'King Khan'. He is the co-owner of the Kolkata Knight Riders, a highly successful IPL franchise which has won multiple titles."
            },
            new Actor
            {
                Name = "Preity Zinta",
                Slug = "preity-zinta",
                PhotoUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60",
                IplTeam = "Punjab Kings",
                Bio = "Acclaimed Bollywood actress known for her bubbly charm and roles in films like Veer-Zaara and Kal Ho Naa Ho. She is the co-owner and active supporter of Punjab Kings (PBKS)."
            },
            new Actor
            {
                Name = "Juhi Chawla",
                Slug = "juhi-chawla",
                PhotoUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60",
                IplTeam = "Kolkata Knight Riders",
                Bio = "Former Miss India and leading Bollywood actress of the 90s. Along with Shah Rukh Khan and her husband Jay Mehta, she co-owns the Kolkata Knight Riders franchise."
            },
            new Actor
            {
                Name = "Abhishek Bachchan",
                Slug = "abhishek-bachchan",
                PhotoUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60",
                IplTeam = "Jaipur Pink Panthers (PKL)",
                Bio = "Bollywood actor and sports enthusiast. While he owns teams in football (ISL) and kabaddi (PKL), he is highly connected with IPL circles and cricket stars."
            },
            new Actor
            {
                Name = "Sameer Hussain",
                Slug = "sameer-hussain",
                PhotoUrl = "/cricket-ball.png",
                IplTeam = "Crossover Enthusiasts",
                Bio = "A passionate Bollywood and Cricket crossover analyst dedicated to tracking connection records on CineCrick."
            }
        };

        context.Actors.AddRange(actors);
        context.SaveChanges();

        // 3. Seed Movies
        var movies = new List<Movie>
        {
            new Movie
            {
                Title = "Lagaan: Once Upon a Time in India",
                Slug = "lagaan",
                PosterUrl = "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&auto=format&fit=crop&q=60",
                ReleaseYear = 2001,
                Plot = "During the British Raj, a small village is challenged to a game of cricket by arrogant British officers to cancel their high taxes. Led by Bhuvan, the villagers must learn the game and win against all odds.",
                CastJson = JsonSerializer.Serialize(new List<Dictionary<string, string>>
                {
                    new Dictionary<string, string> { { "name", "Aamir Khan" }, { "character", "Bhuvan" } },
                    new Dictionary<string, string> { { "name", "Gracy Singh" }, { "character", "Gauri" } },
                    new Dictionary<string, string> { { "name", "Rachel Shelley" }, { "character", "Elizabeth Russell" } }
                })
            },
            new Movie
            {
                Title = "M.S. Dhoni: The Untold Story",
                Slug = "ms-dhoni-untold-story",
                PosterUrl = "https://images.unsplash.com/photo-1540747737956-37872404a8e3?w=500&auto=format&fit=crop&q=60",
                ReleaseYear = 2016,
                Plot = "The biographical sports drama about Mahendra Singh Dhoni's journey from a small-town railway ticket collector in Ranchi to the legendary captain of the Indian Cricket Team.",
                CastJson = JsonSerializer.Serialize(new List<Dictionary<string, string>>
                {
                    new Dictionary<string, string> { { "name", "Sushant Singh Rajput" }, { "character", "M.S. Dhoni" } },
                    new Dictionary<string, string> { { "name", "Kiara Advani" }, { "character", "Sakshi Dhoni" } },
                    new Dictionary<string, string> { { "name", "Disha Patani" }, { "character", "Priyanka Jha" } }
                })
            },
            new Movie
            {
                Title = "83",
                Slug = "83-movie",
                PosterUrl = "https://images.unsplash.com/photo-1531415080290-bc9b85db80f5?w=500&auto=format&fit=crop&q=60",
                ReleaseYear = 2021,
                Plot = "Chronicles the incredible journey of the Indian cricket team's triumph at the 1983 World Cup, led by Kapil Dev, defying all expectations to lift the trophy at Lord's.",
                CastJson = JsonSerializer.Serialize(new List<Dictionary<string, string>>
                {
                    new Dictionary<string, string> { { "name", "Ranveer Singh" }, { "character", "Kapil Dev" } },
                    new Dictionary<string, string> { { "name", "Deepika Padukone" }, { "character", "Romi Dev" } },
                    new Dictionary<string, string> { { "name", "Pankaj Tripathi" }, { "character", "PR Man Singh" } }
                })
            },
            new Movie
            {
                Title = "Patiala House",
                Slug = "patiala-house",
                PosterUrl = "https://images.unsplash.com/photo-1607734834839-de33a7d187c2?w=500&auto=format&fit=crop&q=60",
                ReleaseYear = 2011,
                Plot = "Gattu, a talented bowler in London, is forced to suppress his dreams due to his father's hatred for English society. He gets a secret second chance to play for England's national squad.",
                CastJson = JsonSerializer.Serialize(new List<Dictionary<string, string>>
                {
                    new Dictionary<string, string> { { "name", "Akshay Kumar" }, { "character", "Parghat Singh 'Gattu' Kahlon" } },
                    new Dictionary<string, string> { { "name", "Anushka Sharma" }, { "character", "Simran" } },
                    new Dictionary<string, string> { { "name", "Rishi Kapoor" }, { "character", "Gurtej Singh Kahlon" } }
                })
            },
            new Movie
            {
                Title = "Sachin: A Billion Dreams",
                Slug = "sachin-billion-dreams",
                PosterUrl = "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=500&auto=format&fit=crop&q=60",
                ReleaseYear = 2017,
                Plot = "A docudrama detailing the life and legendary career of Sachin Tendulkar, featuring interviews with himself, family members, and prominent cricketing figures.",
                CastJson = JsonSerializer.Serialize(new List<Dictionary<string, string>>
                {
                    new Dictionary<string, string> { { "name", "Sachin Tendulkar" }, { "character", "Self" } },
                    new Dictionary<string, string> { { "name", "Anjali Tendulkar" }, { "character", "Self" } }
                })
            }
        };

        context.Movies.AddRange(movies);
        context.SaveChanges();

        // 4. Seed Link Table (CricketerMovieLink)
        var dhoni = context.Cricketers.First(c => c.Slug == "ms-dhoni");
        var sachin = context.Cricketers.First(c => c.Slug == "sachin-tendulkar");
        var kapil = context.Cricketers.First(c => c.Slug == "kapil-dev");
        var bhaji = context.Cricketers.First(c => c.Slug == "harbhajan-singh");

        var mDhoni = context.Movies.First(m => m.Slug == "ms-dhoni-untold-story");
        var m83 = context.Movies.First(m => m.Slug == "83-movie");
        var mSachin = context.Movies.First(m => m.Slug == "sachin-billion-dreams");
        var mPatiala = context.Movies.First(m => m.Slug == "patiala-house");

        context.CricketerMovieLinks.AddRange(new List<CricketerMovieLink>
        {
            new CricketerMovieLink { CricketerId = dhoni.Id, MovieId = mDhoni.Id, RoleType = "Biopic Subject" },
            new CricketerMovieLink { CricketerId = sachin.Id, MovieId = mSachin.Id, RoleType = "Self / Lead" },
            new CricketerMovieLink { CricketerId = kapil.Id, MovieId = m83.Id, RoleType = "Biopic Subject / Cameo" },
            new CricketerMovieLink { CricketerId = bhaji.Id, MovieId = mPatiala.Id, RoleType = "Cameo Appearance" }
        });
        context.SaveChanges();

        // 5. Seed Trivia Cards
        var trivia = new List<TriviaCard>
        {
            new TriviaCard
            {
                Title = "SRK's IPL Cartwheels",
                Content = "When Kolkata Knight Riders won their maiden IPL championship in 2012, Shah Rukh Khan celebrated by doing spontaneous cartwheels on the MA Chidambaram outfield in Chennai, creating an iconic IPL memory.",
                ImageUrl = "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500&auto=format&fit=crop&q=60",
                Category = "IPL Moments"
            },
            new TriviaCard
            {
                Title = "Preity Zinta's Home Cooked Support",
                Content = "Preity Zinta is famous for her hands-on ownership of Punjab Kings (formerly Kings XI Punjab). In the inaugural 2008 IPL season, she personally cooked over 100 parathas for the players to keep morale high after a loss.",
                ImageUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60",
                Category = "Owner Trivia"
            },
            new TriviaCard
            {
                Title = "Helicopter Shot Training",
                Content = "For the movie 'M.S. Dhoni: The Untold Story', late actor Sushant Singh Rajput trained for 9 rigorous months with former national selector Kiran More to perfect MS Dhoni's unique helicopter shot and wicketkeeping stance.",
                ImageUrl = "https://images.unsplash.com/photo-1540747737956-37872404a8e3?w=500&auto=format&fit=crop&q=60",
                Category = "Movie Secrets"
            },
            new TriviaCard
            {
                Title = "Yuvraj's Film Legend Dad",
                Content = "Yuvraj Singh's father, Yograj Singh, is not just a former Indian Test bowler but also a famous actor in Punjabi cinema. He has acted in over 40 movies, including playing Milkha Singh's coach in 'Bhaag Milkha Bhaag'.",
                ImageUrl = "https://images.unsplash.com/photo-1531415080290-bc9b85db80f5?w=500&auto=format&fit=crop&q=60",
                Category = "Family Connections"
            },
            new TriviaCard
            {
                Title = "The Lagaan Oscar Legacy",
                Content = "Aamir Khan's 'Lagaan' remains one of only three Indian movies to ever get nominated for the Academy Award for Best Foreign Language Film (joining 'Mother India' and 'Salaam Bombay!'). It took over 6 months to cast all the British actors.",
                ImageUrl = "https://images.unsplash.com/photo-1607734834839-de33a7d187c2?w=500&auto=format&fit=crop&q=60",
                Category = "Awards & Records"
            }
        };

        context.TriviaCards.AddRange(trivia);
        context.SaveChanges();

        // 6. Seed Quiz Questions
        var today = DateTime.UtcNow.Date;
        var quizQuestions = new List<QuizQuestion>
        {
            new QuizQuestion
            {
                Date = today,
                Question = "Which Bollywood superstar co-owns the IPL franchise Kolkata Knight Riders?",
                OptionsJson = JsonSerializer.Serialize(new List<string>
                {
                    "Aamir Khan",
                    "Shah Rukh Khan",
                    "Salman Khan",
                    "Akshay Kumar"
                }),
                CorrectOption = 1, // Shah Rukh Khan
                Category = "IPL Ownership"
            },
            new QuizQuestion
            {
                Date = today.AddDays(1),
                Question = "Who played the lead role in the biographical film 'M.S. Dhoni: The Untold Story'?",
                OptionsJson = JsonSerializer.Serialize(new List<string>
                {
                    "Ranveer Singh",
                    "Sushant Singh Rajput",
                    "Varun Dhawan",
                    "Sidharth Malhotra"
                }),
                CorrectOption = 1, // Sushant Singh Rajput
                Category = "Biopics"
            },
            new QuizQuestion
            {
                Date = today.AddDays(2),
                Question = "Which cricketer made a guest appearance in the Akshay Kumar starrer 'Patiala House'?",
                OptionsJson = JsonSerializer.Serialize(new List<string>
                {
                    "Sachin Tendulkar",
                    "Harbhajan Singh",
                    "Yuvraj Singh",
                    "Zaheer Khan"
                }),
                CorrectOption = 1, // Harbhajan Singh
                Category = "Cameos"
            },
            new QuizQuestion
            {
                Date = today.AddDays(3),
                Question = "Which actress co-owns the Punjab Kings IPL franchise?",
                OptionsJson = JsonSerializer.Serialize(new List<string>
                {
                    "Preity Zinta",
                    "Shilpa Shetty",
                    "Juhi Chawla",
                    "Katrina Kaif"
                }),
                CorrectOption = 0, // Preity Zinta
                Category = "IPL Ownership"
            },
            new QuizQuestion
            {
                Date = today.AddDays(4),
                Question = "In the film '83', which Bollywood actor portrayed the role of legendary captain Kapil Dev?",
                OptionsJson = JsonSerializer.Serialize(new List<string>
                {
                    "Ranbir Kapoor",
                    "Ranveer Singh",
                    "Vicky Kaushal",
                    "John Abraham"
                }),
                CorrectOption = 1, // Ranveer Singh
                Category = "Movies"
            }
        };

        context.QuizQuestions.AddRange(quizQuestions);

        // 7. Seed Admin User
        var admin = new User
        {
            Email = "admin@admin.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            AuthProvider = "email",
            IsAdmin = true
        };
        context.Users.Add(admin);

        context.SaveChanges();
    }
}
