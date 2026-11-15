// Executável que abre o servidor do jogo usando o Node.js instalado no computador.
// Compilar (Windows, sem instalar nada):
//   C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /out:memoria-pokemon.exe launcher\MemoriaPokemon.cs
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;

class MemoriaPokemon
{
    static int Main()
    {
        Console.Title = "Jogo da Memoria Pokemon - servidor";
        string pasta = AppDomain.CurrentDomain.BaseDirectory;

        if (!File.Exists(Path.Combine(pasta, "server.js")))
        {
            return Erro("server.js nao encontrado. Deixe o memoria-pokemon.exe na mesma pasta do codigo.");
        }

        if (Rodar("node", "--version", pasta, true) != 0)
        {
            return Erro("Node.js nao encontrado. Instale em https://nodejs.org e abra de novo.");
        }

        if (!Directory.Exists(Path.Combine(pasta, "node_modules", "ws")))
        {
            Console.WriteLine("Instalando dependencias...");
            if (Rodar("cmd.exe", "/c npm install", pasta, false) != 0)
            {
                return Erro("Nao foi possivel instalar as dependencias (precisa de internet).");
            }
        }

        int codigo = Rodar("node", "server.js", pasta, false);
        Console.WriteLine();
        Console.WriteLine("Servidor encerrado. Pressione Enter para fechar.");
        Console.ReadLine();
        return codigo;
    }

    static int Rodar(string programa, string argumentos, string pasta, bool silencioso)
    {
        var info = new ProcessStartInfo(programa, argumentos)
        {
            WorkingDirectory = pasta,
            UseShellExecute = false,
            RedirectStandardOutput = silencioso,
            RedirectStandardError = silencioso,
        };
        try
        {
            using (var processo = Process.Start(info))
            {
                if (silencioso)
                {
                    processo.StandardOutput.ReadToEnd();
                    processo.StandardError.ReadToEnd();
                }
                processo.WaitForExit();
                return processo.ExitCode;
            }
        }
        catch (Win32Exception)
        {
            return -1;
        }
    }

    static int Erro(string mensagem)
    {
        Console.WriteLine(mensagem);
        Console.WriteLine("Pressione Enter para fechar.");
        Console.ReadLine();
        return 1;
    }
}
