import { FSMCanvas } from './components/FSMCanvas';
import { SchemaBuilder } from './components/SchemaBuilder';
import { EntityManager } from './components/EntityManager';
import { Layers, FileCode, Database } from 'lucide-react';
import { NostrStatus } from './components/NostrStatus';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';

function App() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/logo-aarpia.png" 
                alt="AARPIA" 
                className="h-12 w-auto object-contain"
              />
              <div className="border-l border-primary-foreground/30 pl-4">
                <h1 className="text-xl font-bold tracking-tight">
                  Diseñador Visual FSM
                </h1>
                <p className="text-xs opacity-90 mt-0.5">
                  Arquitectura para Integración y Análisis de Procesos
                </p>
              </div>
            </div>
            <NostrStatus />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-6 py-6 h-full">
          <Tabs defaultValue="entity" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="entity" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Entidad L
              </TabsTrigger>
              <TabsTrigger value="canvas" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Canvas FSM
              </TabsTrigger>
              <TabsTrigger value="schema" className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Esquemas
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="entity" className="h-full mt-0">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Gestión de Entidad L</CardTitle>
                    <CardDescription>
                      Define la entidad del contexto: root, context o local
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EntityManager />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="canvas" className="h-full mt-0">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Canvas FSM</CardTitle>
                    <CardDescription>
                      Diseña estados y transiciones de tu máquina de estados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-5rem)]">
                    <FSMCanvas />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schema" className="h-full mt-0">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Constructor de Esquemas</CardTitle>
                    <CardDescription>
                      Define inputs, outputs y correlaciones de datos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SchemaBuilder />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-3 text-center text-sm text-muted-foreground bg-secondary">
        <p className="font-medium">
          <span className="text-primary">AARPIA</span> v1.0.0 - Arquitectura para Integración y Análisis de Procesos
        </p>
      </footer>
    </div>
  );
}

export default App;
