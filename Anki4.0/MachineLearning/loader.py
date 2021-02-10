from azureml.core import Workspace
from azureml.core.model import Model , InferenceConfig
from azureml.core.environment import Environment
from azureml.core.conda_dependencies import CondaDependencies
from azureml.core.webservice import LocalWebservice

WORKSPACE_NAME = ""
SUBSCRIPTION_ID = ""
RESORCE_ID_NAME = ""

ws = Workspace.get(name=WORKSPACE_NAME, subscription_id=SUBSCRIPTION_ID, resource_group=RESORCE_ID_NAME)

Model.register(model_path = "./multi-qg-qa/models",
                       model_name = "qgeneration",
                       description = "Model trained outside Azure Machine Learning",
                       workspace = ws)

Model.register(model_path = "./checkanswer/models",
                       model_name = "checkanswer",
                       description = "Model trained outside Azure Machine Learning",
                       workspace = ws)

print("Models registered")