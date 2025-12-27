
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Sparkles, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-provider';
import { RealityCheck } from '@/lib/types';
import type { RealityCheckResponse } from '@/lib/types';
import { formatISO } from 'date-fns';
import { realityCheck } from '@/ai/flows/reality-check-flow';

export default function RealityCheckPage() {
  const { toast } = useToast();
  const { realityChecks, setRealityChecks } = useAppContext();

  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAnswers, setGeneratedAnswers] = useState<RealityCheckResponse | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const totalFeedbackCount = useMemo(() => realityChecks.length, [realityChecks]);

  const handleGenerateAnswers = async () => {
    if (!question.trim()) {
      toast({ variant: 'destructive', title: 'Question is empty', description: 'Please enter a question to generate answers.' });
      return;
    }
    setIsLoading(true);
    setGeneratedAnswers(null);
    setSelectedAnswer(null);

    // Simulate an offline response
    setTimeout(() => {
      setGeneratedAnswers({
        answer1: "This is the first placeholder answer, focusing on a direct approach.",
        answer2: "This is a second, alternative perspective on the question provided.",
        answer3: "This is a third, more creative or abstract response to the user's query."
      });
      setIsLoading(false);
    }, 1500);
  };
  
  const handleSaveFeedback = () => {
      if (!question || !generatedAnswers || !selectedAnswer) {
          toast({ variant: 'destructive', title: 'Cannot save feedback', description: 'Please select a preferred answer first.' });
          return;
      }
      
      const newFeedback: RealityCheck = {
          id: crypto.randomUUID(),
          question: question,
          answer1: generatedAnswers.answer1,
          answer2: generatedAnswers.answer2,
          answer3: generatedAnswers.answer3,
          chosenAnswer: selectedAnswer,
          createdAt: formatISO(new Date()),
      };
      
      setRealityChecks([...realityChecks, newFeedback]);
      toast({ title: 'Feedback saved!', description: 'Thank you for helping improve the AI.' });
      
      // Reset state
      setQuestion('');
      setGeneratedAnswers(null);
      setSelectedAnswer(null);
  };
  

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/"><ArrowLeft /></Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Reality Check</h1>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Ask a Question</CardTitle>
                    <CardDescription>Enter a question to test the AI's understanding and get multiple perspectives.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Type your question here..."
                            className="min-h-[100px] text-base"
                            disabled={isLoading}
                        />
                        <Button onClick={handleGenerateAnswers} disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="animate-spin mr-2"/> : <Send className="mr-2"/>}
                            Generate Answers
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isLoading && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <Sparkles className="animate-pulse" /> Generating...
                        </CardTitle>
                        <CardDescription>The AI is thinking. Please wait a moment.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                             <div key={i} className="p-4 border rounded-lg bg-muted/50 animate-pulse h-20"></div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {generatedAnswers && (
                <Card>
                    <CardHeader>
                        <CardTitle>Choose the Best Answer</CardTitle>
                        <CardDescription>Review the generated answers and select the one that is most accurate or helpful.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[generatedAnswers.answer1, generatedAnswers.answer2, generatedAnswers.answer3].map((answer, index) => (
                            <div 
                                key={index} 
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedAnswer === answer ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
                                onClick={() => setSelectedAnswer(answer)}
                            >
                                <p className="font-semibold mb-2">Answer {index + 1}</p>
                                <p className="text-muted-foreground">{answer}</p>
                            </div>
                        ))}
                        <Button onClick={handleSaveFeedback} disabled={!selectedAnswer} className="w-full">
                            <Check className="mr-2"/> Save Feedback
                        </Button>
                    </CardContent>
                </Card>
            )}

        </div>
        <div className="lg:col-span-1">
            <Card className="sticky top-24">
                <CardHeader>
                    <CardTitle>Feedback Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">Total Feedback Entries</p>
                    <p className="text-6xl font-bold text-primary">{totalFeedbackCount}</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
