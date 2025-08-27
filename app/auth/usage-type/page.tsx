"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, ArrowRight, Home, Users } from "lucide-react";

const UsageTypeSelection = () => {
  const [selectedType, setSelectedType] = useState<"personal" | "public" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  console.log("UsageTypeSelection component rendered, user:", user);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      console.log("No user in usage type selection, redirecting to login");
      router.push("/auth/login");
    }
  }, [user, router]);

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleTypeSelect = async () => {
    if (!selectedType || !user) return;
    
    setIsLoading(true);
    try {
      if (selectedType === "personal") {
        // For personal use, set role as "individual" and redirect to dashboard
        const token = await user.getIdToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/update-role`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "individual" }),
        });

        if (!response.ok) {
          throw new Error("Failed to update role");
        }

        console.log("Personal use selected, redirecting to dashboard");
        router.push("/dashboard");
      } else {
        // For public use, redirect to role selection
        console.log("Public use selected, redirecting to role selection");
        router.push("/auth/role-selection");
      }
    } catch (error) {
      console.error("Error updating usage type:", error);
      alert("Failed to update usage type. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const usageTypes = [
    {
      id: "personal" as const,
      title: "Personal Use",
      description: "Manage your own contacts and activities",
      icon: User,
      features: [
        "Personal contact management",
        "Individual activity tracking",
        "Private dashboard",
        "Personal CRM features"
      ],
      color: "bg-green-500",
      badge: "Recommended for individuals"
    },
    {
      id: "public" as const,
      title: "Public/Team Use",
      description: "Collaborate with team members and organizations",
      icon: Building2,
      features: [
        "Team collaboration",
        "Organization management",
        "Role-based access",
        "Advanced team features"
      ],
      color: "bg-blue-500",
      badge: "For teams & organizations"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/80 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            How will you use CRM Pro?
          </CardTitle>
          <CardDescription>
            Choose your usage type to personalize your experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {usageTypes.map((type) => {
              const IconComponent = type.icon;
              const isSelected = selectedType === type.id;
              
              return (
                <div
                  key={type.id}
                  className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                  
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${type.color} rounded-lg flex items-center justify-center mr-4`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{type.title}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {type.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <Badge className="mt-3 bg-gray-100 text-gray-800 hover:bg-gray-200">
                    {type.badge}
                  </Badge>
                </div>
              );
            })}
          </div>
          
          <Button
            onClick={handleTypeSelect}
            disabled={!selectedType || isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
          >
            {isLoading ? (
              "Setting up your account..."
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            You can change your usage type later in your profile settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageTypeSelection;
