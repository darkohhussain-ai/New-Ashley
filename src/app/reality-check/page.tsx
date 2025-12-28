
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Check, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-provider';
import { RealityCheck } from '@/lib/types';
import type { RealityCheckResponse } from '@/lib/types';
import { formatISO } from 'date-fns';
import { Label } from '@/components/ui/label';

export default function RealityCheckPage() {
  const { toast } = useToast();
  const { realityChecks, setRealityChecks } = useAppContext();

  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<RealityCheckResponse>({ answer1: '', answer2: '', answer3: '' });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const totalFeedbackCount = useMemo(() => realityChecks.length, [realityChecks]);

  const handleSaveFeedback = () => {
    if (!question.trim()) {
        toast({ variant: 'destructive', title: 'Cannot save', description: 'Please enter a question.' });
        return;
    }
    if (!answers.answer1.trim() || !answers.answer2.trim() || !answers.answer3.trim()) {
        toast({ variant: 'destructive', title: 'Cannot save', description: 'Please provide all three answers.' });
        return;
    }
    if (!selectedAnswer) {
        toast({ variant: 'destructive', title: 'Cannot save feedback', description: 'Please select a preferred answer first.' });
        return;
    }

    const newFeedback: RealityCheck = {
      id: crypto.randomUUID(),
      question: question,
      answer1: answers.answer1,
      answer2: answers.answer2,
      answer3: answers.answer3,
      chosenAnswer: selectedAnswer,
      createdAt: formatISO(new Date()),
    };

    setRealityChecks([...realityChecks, newFeedback]);
    toast({ title: 'Feedback saved!', description: 'Your reality check entry has been recorded.' });

    // Reset state
    setQuestion('');
    setAnswers({ answer1: '', answer2: '', answer3: '' });
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
                    <CardTitle>Create a Reality Check</CardTitle>
                    <CardDescription>Enter a question, provide three possible answers, and then choose the best one.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="question" className="text-base font-semibold">Question</Label>
                        <Textarea
                            id="question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Type your question here..."
                            className="min-h-[100px] text-base"
                        />
                    </div>
                    
                    <div className="space-y-4">
                         <div className="space-y-2">
                            <Label htmlFor="answer1" className="font-semibold">Answer 1</Label>
                            <Textarea
                                id="answer1"
                                value={answers.answer1}
                                onChange={(e) => setAnswers(prev => ({...prev, answer1: e.target.value}))}
                                placeholder="Enter the first possible answer..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="answer2" className="font-semibold">Answer 2</Label>
                            <Textarea
                                id="answer2"
                                value={answers.answer2}
                                onChange={(e) => setAnswers(prev => ({...prev, answer2: e.target.value}))}
                                placeholder="Enter the second possible answer..."
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="answer3" className="font-semibold">Answer 3</Label>
                            <Textarea
                                id="answer3"
                                value={answers.answer3}
                                onChange={(e) => setAnswers(prev => ({...prev, answer3: e.target.value}))}
                                placeholder="Enter the third possible answer..."
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Choose the Best Answer</CardTitle>
                    <CardDescription>Review your answers and select the one that is most accurate or helpful.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[answers.answer1, answers.answer2, answers.answer3].map((answer, index) => (
                        <div 
                            key={index} 
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedAnswer === answer ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
                            onClick={() => answer.trim() && setSelectedAnswer(answer)}
                        >
                            <p className="font-semibold mb-2">Answer {index + 1}</p>
                            <p className="text-muted-foreground">{answer || "..."}</p>
                        </div>
                    ))}
                    <Button onClick={handleSaveFeedback} disabled={!selectedAnswer} className="w-full">
                        <Save className="mr-2"/> Save Feedback
                    </Button>
                </CardContent>
            </Card>

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
